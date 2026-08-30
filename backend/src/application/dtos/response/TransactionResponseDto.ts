export interface TransactionResponseDto {
    id: string;
    type: "ingreso" | "egreso";
    amount: number;
    moneySourceId: string;
    currency: "ARS" | "USD";
    categoryId: string;
    date: string;
    description: string;
    createdAt: string;
}
