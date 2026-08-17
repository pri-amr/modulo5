import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '../../application/errors/NotFoundError';
import { CreateTransactionService } from '../../application/services/CreateTransactionService';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { MoneySourceRepository } from '../../infrastructure/repositories/MoneySourceRepository';
import { TransactionRepository } from '../../infrastructure/repositories/TransactionRepository';

const createTransactionService = new CreateTransactionService(
  new TransactionRepository(),
  new MoneySourceRepository(),
  new CategoryRepository(),
);

// La validación del body está delegada íntegramente a `CreateTransactionRequestDto` (Zod) dentro
// de `CreateTransactionService.execute` — este controller no duplica reglas de validación.
export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new NotFoundError('Usuario no resuelto');
    }

    const transaction = await createTransactionService.execute(req.userId, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};
