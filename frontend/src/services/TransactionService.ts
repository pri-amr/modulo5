import axios from "axios";

import axiosClient from "@/lib/axiosClient";
import type { CreateTransactionRequestDto, TransactionResponseDto } from "@/models/Transaction.types";

const DEFAULT_ERROR_MESSAGE = "No se pudo registrar la transacción. Intentá nuevamente.";

export const TransactionService = {
  createTransaction: async (
    dto: CreateTransactionRequestDto,
    signal?: AbortSignal,
  ): Promise<TransactionResponseDto> => {
    try {
      const response = await axiosClient.post<TransactionResponseDto>("/api/transactions", dto, {
        signal,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        throw new Error(error.response?.data?.error ?? DEFAULT_ERROR_MESSAGE);
      }

      throw error;
    }
  },
};
