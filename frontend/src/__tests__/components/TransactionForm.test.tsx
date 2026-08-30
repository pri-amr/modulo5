import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";

import TransactionForm from "@/components/TransactionForm";
import type { SelectOption } from "@/models/Transaction.types";
import { TransactionService } from "@/services/TransactionService";

jest.mock("../../services/TransactionService", () => ({
    TransactionService: { createTransaction: jest.fn() }
}));

const mockedCreateTransaction =
    TransactionService.createTransaction as jest.Mock;

const MONEY_SOURCE_OPTIONS: SelectOption[] = [
    { value: "money-source-test-id", label: "Efectivo" }
];
const CATEGORY_OPTIONS: SelectOption[] = [
    { value: "category-test-id", label: "General" }
];

const renderForm = (): ReturnType<typeof render> =>
    render(
        <TransactionForm
            moneySourceOptions={MONEY_SOURCE_OPTIONS}
            categoryOptions={CATEGORY_OPTIONS}
        />
    );

type FieldFillOverrides = Partial<{
    type: string;
    amount: string;
    moneySourceId: string;
    currency: string;
    categoryId: string;
    date: string;
    description: string;
}>;

const VALID_FIELDS: Required<FieldFillOverrides> = {
    type: "egreso",
    amount: "100",
    moneySourceId: "money-source-test-id",
    currency: "ARS",
    categoryId: "category-test-id",
    date: "02-08-2026",
    description: "Supermercado"
};

const FIELD_LABELS: Record<keyof FieldFillOverrides, string> = {
    type: "Tipo",
    amount: "Monto",
    moneySourceId: "Fuente de dinero",
    currency: "Moneda",
    categoryId: "Categoría",
    date: "Fecha (DD-MM-YYYY)",
    description: "Descripción"
};

const fillForm = (overrides: FieldFillOverrides = {}): void => {
    const fields = { ...VALID_FIELDS, ...overrides };

    (Object.keys(fields) as Array<keyof FieldFillOverrides>).forEach(
        (field) => {
            fireEvent.change(screen.getByLabelText(FIELD_LABELS[field]), {
                target: { value: fields[field] }
            });
        }
    );
};

const submitForm = (): void => {
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
};

describe("TransactionForm", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("completa un egreso válido y confirma → llama a TransactionService con el DTO correcto (AC-01)", async () => {
        mockedCreateTransaction.mockResolvedValueOnce({
            id: "tx-1",
            type: "egreso",
            amount: 100,
            moneySourceId: "money-source-test-id",
            currency: "ARS",
            categoryId: "category-test-id",
            date: "02-08-2026",
            description: "Supermercado",
            createdAt: "2026-08-02T00:00:00.000Z"
        });

        renderForm();
        fillForm({ type: "egreso" });
        submitForm();

        await waitFor(() =>
            expect(mockedCreateTransaction).toHaveBeenCalledWith(
                {
                    type: "egreso",
                    amount: 100,
                    moneySourceId: "money-source-test-id",
                    currency: "ARS",
                    categoryId: "category-test-id",
                    date: "02-08-2026",
                    description: "Supermercado"
                },
                expect.any(AbortSignal)
            )
        );
    });

    it("completa un ingreso válido y confirma → llama a TransactionService con el DTO correcto (AC-02)", async () => {
        mockedCreateTransaction.mockResolvedValueOnce({
            id: "tx-2",
            type: "ingreso",
            amount: 500,
            moneySourceId: "money-source-test-id",
            currency: "USD",
            categoryId: "category-test-id",
            date: "15-01-2026",
            description: "Sueldo",
            createdAt: "2026-01-15T00:00:00.000Z"
        });

        renderForm();
        fillForm({
            type: "ingreso",
            amount: "500",
            currency: "USD",
            date: "15-01-2026",
            description: "Sueldo"
        });
        submitForm();

        await waitFor(() =>
            expect(mockedCreateTransaction).toHaveBeenCalledWith(
                {
                    type: "ingreso",
                    amount: 500,
                    moneySourceId: "money-source-test-id",
                    currency: "USD",
                    categoryId: "category-test-id",
                    date: "15-01-2026",
                    description: "Sueldo"
                },
                expect.any(AbortSignal)
            )
        );
    });

    it("enviar sin monto → error de validación visible, no se llama al service (AC-04)", async () => {
        renderForm();
        fillForm({ amount: "" });
        submitForm();

        expect(
            await screen.findByText("El monto es requerido")
        ).toBeInTheDocument();
        expect(mockedCreateTransaction).not.toHaveBeenCalled();
    });

    it("enviar con monto <= 0 → error de validación visible (AC-05)", async () => {
        renderForm();
        fillForm({ amount: "0" });
        submitForm();

        expect(
            await screen.findByText("El monto debe ser mayor a 0")
        ).toBeInTheDocument();
        expect(mockedCreateTransaction).not.toHaveBeenCalled();
    });

    it("enviar sin fuente/moneda/categoría/fecha/descripción (uno por caso) → error de validación visible (AC-06)", async () => {
        const casesMissingOneField: Array<{
            overrides: FieldFillOverrides;
            expectedError: string;
        }> = [
            {
                overrides: { moneySourceId: "" },
                expectedError: "La fuente de dinero es requerida"
            },
            {
                overrides: { currency: "" },
                expectedError: "Seleccioná una moneda válida"
            },
            {
                overrides: { categoryId: "" },
                expectedError: "La categoría es requerida"
            },
            { overrides: { date: "" }, expectedError: "La fecha es requerida" },
            {
                overrides: { description: "" },
                expectedError: "La descripción es requerida"
            }
        ];

        for (const { overrides, expectedError } of casesMissingOneField) {
            renderForm();
            fillForm(overrides);
            submitForm();

            expect(await screen.findByText(expectedError)).toBeInTheDocument();
            expect(mockedCreateTransaction).not.toHaveBeenCalled();

            cleanup();
        }
    });

    it("enviar con fecha en formato distinto a DD-MM-YYYY → error de validación visible (AC-09)", async () => {
        renderForm();
        fillForm({ date: "2026-08-02" });
        submitForm();

        expect(
            await screen.findByText("La fecha debe tener el formato DD-MM-YYYY")
        ).toBeInTheDocument();
        expect(mockedCreateTransaction).not.toHaveBeenCalled();
    });

    it("el service devuelve 403 → el hook expone el error y el formulario conserva los datos ingresados (AC-07, AC-08)", async () => {
        mockedCreateTransaction.mockRejectedValueOnce(
            new Error("La fuente de dinero no existe o no pertenece al usuario")
        );

        renderForm();
        fillForm();
        submitForm();

        expect(
            await screen.findByText(
                "La fuente de dinero no existe o no pertenece al usuario"
            )
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Descripción")).toHaveValue(
            VALID_FIELDS.description
        );
        expect(screen.getByLabelText("Monto")).toHaveValue(
            Number(VALID_FIELDS.amount)
        );
    });

    it("el service devuelve 500 → el hook expone el error y el formulario conserva los datos ingresados (AC-08)", async () => {
        mockedCreateTransaction.mockRejectedValueOnce(
            new Error("Internal server error")
        );

        renderForm();
        fillForm();
        submitForm();

        expect(
            await screen.findByText("Internal server error")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Descripción")).toHaveValue(
            VALID_FIELDS.description
        );
        expect(screen.getByLabelText("Monto")).toHaveValue(
            Number(VALID_FIELDS.amount)
        );
    });

    it("mientras la request está en curso, Loader está visible; al finalizar, deja de estarlo (AC-10)", async () => {
        let resolveRequest: (() => void) | undefined;
        mockedCreateTransaction.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRequest = (): void =>
                        resolve({
                            id: "tx-3",
                            type: "egreso",
                            amount: 100,
                            moneySourceId: "money-source-test-id",
                            currency: "ARS",
                            categoryId: "category-test-id",
                            date: "02-08-2026",
                            description: "Supermercado",
                            createdAt: "2026-08-02T00:00:00.000Z"
                        });
                })
        );

        renderForm();
        fillForm();

        expect(screen.queryByRole("status")).not.toBeInTheDocument();

        submitForm();

        await waitFor(() =>
            expect(screen.getByRole("status")).toBeInTheDocument()
        );

        await act(async () => {
            resolveRequest?.();
            await Promise.resolve();
        });

        await waitFor(() =>
            expect(screen.queryByRole("status")).not.toBeInTheDocument()
        );
    });

    it("sin errores, los 7 campos tienen border-line y no border-error (AC-04)", () => {
        renderForm();

        const fields = [
            screen.getByLabelText("Tipo"),
            screen.getByLabelText("Monto"),
            screen.getByLabelText("Fuente de dinero"),
            screen.getByLabelText("Moneda"),
            screen.getByLabelText("Categoría"),
            screen.getByLabelText("Fecha (DD-MM-YYYY)"),
            screen.getByLabelText("Descripción")
        ];

        fields.forEach((field) => {
            expect(field).toHaveClass("border-line");
            expect(field).not.toHaveClass("border-error");
        });
    });

    it("tras un submit inválido, los campos con error tienen border-error y no border-line (AC-05)", async () => {
        renderForm();
        fillForm({
            amount: "",
            moneySourceId: "",
            currency: "",
            categoryId: "",
            date: "",
            description: ""
        });
        submitForm();

        await waitFor(() =>
            expect(screen.getByLabelText("Monto")).toHaveClass("border-error")
        );

        const fieldsWithError = [
            screen.getByLabelText("Monto"),
            screen.getByLabelText("Fuente de dinero"),
            screen.getByLabelText("Moneda"),
            screen.getByLabelText("Categoría"),
            screen.getByLabelText("Fecha (DD-MM-YYYY)"),
            screen.getByLabelText("Descripción")
        ];

        fieldsWithError.forEach((field) => {
            expect(field).toHaveClass("border-error");
            expect(field).not.toHaveClass("border-line");
        });

        expect(screen.getByLabelText("Tipo")).toHaveClass("border-line");
        expect(screen.getByLabelText("Tipo")).not.toHaveClass("border-error");
    });

    it("labels y textos de error de campo tienen las clases correctas (AC-06)", async () => {
        renderForm();

        const labels = [
            "Tipo",
            "Monto",
            "Fuente de dinero",
            "Moneda",
            "Categoría",
            "Fecha (DD-MM-YYYY)",
            "Descripción"
        ];

        labels.forEach((text) => {
            expect(screen.getByText(text)).toHaveClass(
                "block",
                "text-sm",
                "font-medium"
            );
        });

        fillForm({ amount: "" });
        submitForm();

        const errorMessage = await screen.findByText("El monto es requerido");
        expect(errorMessage).toHaveClass("mt-1", "text-sm", "text-error");
    });

    it("el botón de submit tiene bg-accent y disabled:opacity-50 en su clase, y se deshabilita mientras loading=true (AC-07)", async () => {
        let resolveRequest: (() => void) | undefined;
        mockedCreateTransaction.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRequest = (): void =>
                        resolve({
                            id: "tx-4",
                            type: "egreso",
                            amount: 100,
                            moneySourceId: "money-source-test-id",
                            currency: "ARS",
                            categoryId: "category-test-id",
                            date: "02-08-2026",
                            description: "Supermercado",
                            createdAt: "2026-08-02T00:00:00.000Z"
                        });
                })
        );

        renderForm();
        fillForm();

        const button = screen.getByRole("button", {
            name: "Confirmar"
        }) as HTMLButtonElement;
        expect(button).toHaveClass("bg-accent");
        expect(button).toHaveClass("disabled:opacity-50");
        expect(button.disabled).toBe(false);

        submitForm();

        await waitFor(() => expect(button.disabled).toBe(true));

        await act(async () => {
            resolveRequest?.();
            await Promise.resolve();
        });

        await waitFor(() => expect(button.disabled).toBe(false));
    });

    it('el campo Descripción se renderiza como <input type="text"> (AC-09)', () => {
        renderForm();

        const description = screen.getByLabelText(
            "Descripción"
        ) as HTMLInputElement;
        expect(description.tagName).toBe("INPUT");
        expect(description.type).toBe("text");
    });
});
