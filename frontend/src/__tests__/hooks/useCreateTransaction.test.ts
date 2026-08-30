import { act, renderHook, waitFor } from "@testing-library/react";

import {
    useCreateTransaction,
    type TransactionFormValues
} from "@/hooks/useCreateTransaction";
import { TransactionService } from "@/services/TransactionService";

jest.mock("../../services/TransactionService", () => ({
    TransactionService: { createTransaction: jest.fn() }
}));

const mockedCreateTransaction =
    TransactionService.createTransaction as jest.Mock;

const VALID_VALUES: TransactionFormValues = {
    type: "egreso",
    amount: "100",
    moneySourceId: "fuente-1",
    currency: "ARS",
    categoryId: "categoria-1",
    date: "02-08-2026",
    description: "Supermercado"
};

describe("useCreateTransaction — cancelación al desmontar", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("aborta la request en curso al desmontarse y no actualiza estado del componente desmontado", async () => {
        let capturedSignal: AbortSignal | undefined;

        mockedCreateTransaction.mockImplementation(
            (_dto: unknown, signal?: AbortSignal) =>
                new Promise(() => {
                    capturedSignal = signal;
                })
        );

        const { result, unmount } = renderHook(() => useCreateTransaction());

        act(() => {
            Object.entries(VALID_VALUES).forEach(([field, value]) => {
                result.current.setFieldValue(
                    field as keyof TransactionFormValues,
                    value
                );
            });
        });

        act(() => {
            void result.current.submit();
        });

        await waitFor(() => expect(result.current.loading).toBe(true));

        expect(capturedSignal?.aborted).toBe(false);

        unmount();

        expect(capturedSignal?.aborted).toBe(true);
    });
});
