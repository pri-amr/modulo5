import type { Transaction } from "../../../domain/entities/Transaction";
import type { TransactionResponseDto } from "../../dtos/response/TransactionResponseDto";

export const TransactionMapper = {
    toResponseDto: (transaction: Transaction): TransactionResponseDto => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        moneySourceId: transaction.moneySourceId,
        currency: transaction.currency,
        categoryId: transaction.categoryId,
        date: transaction.date,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString()
    })
};
