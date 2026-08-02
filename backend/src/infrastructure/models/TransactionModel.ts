import { model, Schema, Types, type Document } from 'mongoose';

import type { Transaction } from '../../domain/entities/Transaction';

export interface TransactionDocument
  extends Document,
    Omit<Transaction, 'id' | 'userId' | 'moneySourceId' | 'categoryId'> {
  userId: Types.ObjectId;
  moneySourceId: Types.ObjectId;
  categoryId: Types.ObjectId;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['ingreso', 'egreso'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    moneySourceId: { type: Schema.Types.ObjectId, ref: 'MoneySource', required: true, index: true },
    currency: { type: String, enum: ['ARS', 'USD'], required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    date: { type: String, required: true },
    description: { type: String, required: true, maxlength: 500 },
  },
  { strict: true, timestamps: true },
);

export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);
