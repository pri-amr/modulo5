import type { MoneySource } from "../entities/MoneySource";

export interface IMoneySourceRepository {
    findById(id: string): Promise<MoneySource | null>;
    incrementAmount(
        id: string,
        currency: "ARS" | "USD",
        delta: number
    ): Promise<void>;
}
