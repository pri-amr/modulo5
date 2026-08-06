import type { ZodError } from 'zod';

import { CreateTransactionRequestSchema } from '../dtos/request/CreateTransactionRequestDto';
import type { TransactionResponseDto } from '../dtos/response/TransactionResponseDto';
import { ForbiddenError } from '../errors/ForbiddenError';
import { ValidationError } from '../errors/ValidationError';
import { TransactionMapper } from '../helpers/mappers/TransactionMapper';
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import type { IMoneySourceRepository } from '../../domain/repositories/IMoneySourceRepository';
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';

const buildValidationMessage = (error: ZodError): string =>
  error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');

export class CreateTransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly moneySourceRepository: IMoneySourceRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(userId: string, dto: unknown): Promise<TransactionResponseDto> {
    const parsed = CreateTransactionRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throw new ValidationError(buildValidationMessage(parsed.error));
    }

    const { type, amount, moneySourceId, currency, categoryId, date, description } = parsed.data;

    const moneySource = await this.moneySourceRepository.findById(moneySourceId);
    if (!moneySource || moneySource.userId !== userId) {
      throw new ForbiddenError('La fuente de dinero no existe o no pertenece al usuario');
    }

    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.userId !== userId) {
      throw new ForbiddenError('La categoría no existe o no pertenece al usuario');
    }

    const transaction = await this.transactionRepository.create({
      userId,
      type,
      amount,
      moneySourceId,
      currency,
      categoryId,
      date,
      description,
    });

    const delta = type === 'ingreso' ? amount : -amount;

    try {
      await this.moneySourceRepository.incrementAmount(moneySourceId, currency, delta);
    } catch (error) {
      await this.transactionRepository.deleteById(transaction.id);
      throw error;
    }

    return TransactionMapper.toResponseDto(transaction);
  }
}
