import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { TransactionService } from './storage/transaction.service';
import { EthService } from './eth.service';

@Injectable()
export class AppService {
  private web3: any;

  constructor(
    private readonly transactionService: TransactionService,
    private readonly ethListenerService: EthService,
    @Inject(Web3) private readonly web3Provider: Web3,
  ) {
    this.web3 = new Web3(web3Provider);
  }

  async getTotalTransfers(): Promise<string> {
    const transfers = await this.transactionService.getEventsByName('Transfer');

    let totalTokensTransferred = new BigNumber(0);

    transfers.forEach((transfer) => {
      const eventData = transfer.eventData
        ? this.web3.utils.fromWei(transfer.eventData.data, 'ether')
        : this.web3.utils.toBN(0);
      totalTokensTransferred = totalTokensTransferred.plus(eventData);
    });

    return totalTokensTransferred.toFixed(0);
  }

  async getInteractionByTxHash(txHash: string) {
    try {
      const exists = await this.transactionService.containsTx(txHash);
      if (exists) {
        return true;
      }
      return await this.ethListenerService.getInteractionByTxHash(txHash);
    } catch (error) {
      throw new NotFoundException('Transaction not found');
    }
  }
}
