import { Types } from 'mongoose';

import type { Transaction } from '../../domain/entities/Transaction';
import type {
  CreateTransactionInput,
  ITransactionRepository,
} from '../../domain/repositories/ITransactionRepository';
import { TransactionModel, type TransactionDocument } from '../models/TransactionModel';

const toEntity = (document: TransactionDocument): Transaction => ({
  id: document._id.toString(),
  userId: document.userId.toString(),
  type: document.type,
  amount: document.amount,
  moneySourceId: document.moneySourceId.toString(),
  currency: document.currency,
  categoryId: document.categoryId.toString(),
  date: document.date,
  description: document.description,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export class TransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const document = await TransactionModel.create({
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      moneySourceId: input.moneySourceId,
      currency: input.currency,
      categoryId: input.categoryId,
      date: input.date,
      description: input.description,
    });

    return toEntity(document);
  }

  async findById(id: string): Promise<Transaction | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const document = await TransactionModel.findById(id);
    return document ? toEntity(document) : null;
  }

  async deleteById(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      return;
    }

    await TransactionModel.findByIdAndDelete(id);
  }
}
