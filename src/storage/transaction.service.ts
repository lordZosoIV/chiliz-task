import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  async saveEvent(eventData: any) {
    await this.transactionModel.create({
      blockNumber: Number(eventData.blockNumber),
      logIndex: Number(eventData.logIndex),
      transactionHash: eventData.transactionHash,
      eventName: eventData.event,
      eventData: eventData,
    });
  }

  async containsTx(txHash: string) {
    const existingTransaction = await this.transactionModel
      .findOne({ transactionHash: txHash })
      .exec();
    return !!existingTransaction;
  }

  async getLastSyncedBlockFromDB(): Promise<Transaction> {
    try {
      const lastBlock = await this.transactionModel.aggregate([
        { $sort: { blockNumber: -1, logIndex: -1 } },
        { $limit: 1 },
      ]);

      if (
        lastBlock !== null &&
        Array.isArray(lastBlock) &&
        lastBlock.length > 0
      ) {
        return lastBlock[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching latest synced block number:', error);
      return null;
    }
  }

  async getEventsByName(name: string) {
    return await this.transactionModel.find({ eventName: name }).exec();
  }
}
