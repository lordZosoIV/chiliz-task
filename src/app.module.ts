import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { EthService } from './eth.service';
import {
  Transaction,
  TransactionSchema,
} from './storage/schemas/transaction.schema';
import { TransactionService } from './storage/transaction.service';
import * as dotenv from 'dotenv';
import { Web3Provider } from './web3.provider';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, EthService, TransactionService, Web3Provider],
})
export class AppModule {}
