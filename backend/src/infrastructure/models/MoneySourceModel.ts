import { model, Schema, Types, type Document } from 'mongoose';

import type { MoneySource } from '../../domain/entities/MoneySource';

export interface MoneySourceDocument extends Document, Omit<MoneySource, 'id' | 'userId'> {
  userId: Types.ObjectId;
}

const moneySourceSchema = new Schema<MoneySourceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    virtual: { type: Boolean, required: true },
    amountARS: { type: Number, required: true, default: 0 },
    amountUSD: { type: Number, required: true, default: 0 },
  },
  { strict: true },
);

export const MoneySourceModel = model<MoneySourceDocument>('MoneySource', moneySourceSchema);
