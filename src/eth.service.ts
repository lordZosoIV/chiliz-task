import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Web3 from 'web3';
import { CHZ_ABI } from './abi/CHZ_ABI';
import { Subscription } from 'rxjs';
import { Transaction } from './storage/schemas/transaction.schema';
import { TransactionService } from './storage/transaction.service';
import * as dotenv from 'dotenv';

@Injectable()
export class EthService implements OnModuleInit, OnModuleDestroy {
  private web3: any;
  private chzContract: any;
  private eventSubscription: Subscription | null = null;

  constructor(
    private readonly transactionService: TransactionService,
    @Inject(Web3) private readonly web3Provider: Web3,
  ) {
    dotenv.config();
    this.web3 = new Web3(web3Provider);
  }

  async onModuleInit() {
    await this.connectToWebSocket();
  }

  async onModuleDestroy() {
    await this.disconnectFromWebSocket();
  }

  async getInteractionByTxHash(txHash: string) {
    try {
      if (!this.web3.utils.isHexStrict(txHash) || txHash.length !== 66) {
        throw new BadRequestException('Invalid transaction hash format');
      }

      const tx = await this.web3.eth.getTransaction(txHash);

      if (!tx) {
        throw new NotFoundException('Transaction not found');
      }

      return (
        tx.to === this.getContractAddress() ||
        tx.from === this.getContractAddress()
      );
    } catch (error) {
      throw new NotFoundException('Transaction not found');
    }
  }

  private async connectToWebSocket() {
    const provider = this.web3.currentProvider;

    provider.on('error', (error) => {
      console.error('WebSocket Provider Error:', error);
      this.reconnectToWebSocket();
    });

    provider.on('end', () => {
      console.log('WebSocket Provider disconnected');
      this.reconnectToWebSocket();
    });

    provider.on('connect', async () => {
      console.log('WebSocket Provider connected');
      this.web3 = new Web3(provider);
      this.chzContract = new this.web3.eth.Contract(
        CHZ_ABI,
        this.getContractAddress(),
      );
      await this.subscribeToEvents();
    });

    this.web3 = new Web3(provider);
  }

  private async disconnectFromWebSocket() {
    if (
      this.web3 &&
      this.web3.currentProvider &&
      this.web3.currentProvider instanceof Web3.providers.WebsocketProvider
    ) {
      await this.web3.currentProvider.disconnect();
    }
  }

  private reconnectToWebSocket() {
    console.log('Attempting to reconnect to WebSocket...');
    setTimeout(async () => {
      await this.connectToWebSocket();
    }, 5000);
  }

  private async subscribeToEvents() {
    let lastSyncedBlock;
    const lastSyncedTx: Transaction =
      await this.transactionService.getLastSyncedBlockFromDB();
    if (lastSyncedTx === undefined || lastSyncedTx === null) {
      lastSyncedBlock = this.getStartBlock();
    } else {
      lastSyncedBlock = lastSyncedTx.blockNumber;
    }
    console.log('Last synced block is', lastSyncedBlock);

    const event = this.chzContract.events.allEvents({
      fromBlock: lastSyncedBlock,
    });

    this.eventSubscription = event.on('data', async (eventData) => {
      console.log(
        `event came with txHash: ${eventData.transactionHash} and blockNumber: ${eventData.blockNumber}`,
      );
      if (
        lastSyncedTx !== undefined &&
        lastSyncedTx !== null &&
        Number(eventData.blockNumber) === lastSyncedBlock &&
        Number(eventData.logIndex) <= lastSyncedTx.logIndex
      ) {
        console.log(`already persisted tx: ${eventData.transactionHash}`);
      } else {
        await this.transactionService.saveEvent(eventData);
      }
    });

    event.on('error', (error) => {
      console.error('Event Subscription Error:', error);
      this.reconnectToWebSocket();
    });
  }

  private getProviderUrl(): string {
    return process.env.PROVIDER_URL;
  }

  private getContractAddress(): string {
    return process.env.CONTRACT_ADDRESS;
  }

  private getStartBlock(): number {
    return parseInt(process.env.START_BLOCK);
  }
}
