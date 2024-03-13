import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Transaction {
  @Prop({ name: 'blockNumber' })
  blockNumber: number;
  @Prop({ name: 'logIndex' })
  logIndex: number;

  @Prop({ name: 'transactionHash' })
  transactionHash: string;

  @Prop({ name: 'eventName' })
  eventName: string;

  @Prop({ name: 'eventData', type: Object })
  eventData: any;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
