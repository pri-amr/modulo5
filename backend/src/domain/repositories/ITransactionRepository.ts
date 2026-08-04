import type { Transaction } from '../entities/Transaction';

export interface CreateTransactionInput {
  userId: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  moneySourceId: string;
  currency: 'ARS' | 'USD';
  categoryId: string;
  date: string;
  description: string;
}

export interface ITransactionRepository {
  create(input: CreateTransactionInput): Promise<Transaction>;
  deleteById(id: string): Promise<void>;
}
