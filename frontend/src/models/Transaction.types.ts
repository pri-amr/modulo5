export type SelectOption = {
  value: string;
  label: string;
};

export type TransactionType = "ingreso" | "egreso";

export type Currency = "ARS" | "USD";

export type CreateTransactionRequestDto = {
  type: TransactionType;
  amount: number;
  moneySourceId: string;
  currency: Currency;
  categoryId: string;
  date: string;
  description: string;
};

export type TransactionResponseDto = {
  id: string;
  type: TransactionType;
  amount: number;
  moneySourceId: string;
  currency: Currency;
  categoryId: string;
  date: string;
  description: string;
  createdAt: string;
};
