import type { SelectOption } from "@/models/Transaction.types";

// No existe (todavía) un endpoint GET para listar fuentes de dinero/categorías del usuario
// (solo existe POST /api/transactions — ver backend/src/presentation/routes/transaction.routes.ts).
// Estos `value` son los `_id` fijos y determinísticos del seed idempotente del backend
// (backend/src/infrastructure/database/seed.ts: SEED_MONEY_SOURCE_ID, SEED_CATEGORY_ID),
// no los nombres del documento — el backend valida moneySourceId/categoryId contra el `_id`
// real de Mongo (CreateTransactionService → findById).
export const MONEY_SOURCE_OPTIONS: SelectOption[] = [
    { value: "000000000000000000000001", label: "Efectivo" }
];

export const CATEGORY_OPTIONS: SelectOption[] = [
    { value: "000000000000000000000002", label: "General" }
];
