"use client";

import type { ChangeEvent, FormEvent } from "react";

import FormField from "@/components/FormField";
import Loader from "@/components/Loader";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import type { TransactionFormValues } from "@/hooks/useCreateTransaction";
import type { SelectOption } from "@/models/Transaction.types";

type TransactionFormProps = {
    moneySourceOptions: SelectOption[];
    categoryOptions: SelectOption[];
};

const TransactionForm = ({
    moneySourceOptions,
    categoryOptions
}: TransactionFormProps): React.JSX.Element => {
    const {
        values,
        fieldErrors,
        loading,
        error,
        success,
        setFieldValue,
        submit
    } = useCreateTransaction();

    const handleChange =
        (field: keyof TransactionFormValues) =>
        (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
            setFieldValue(field, event.target.value);
        };

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        void submit();
    };

    const hasError = (field: keyof TransactionFormValues): boolean =>
        Boolean(fieldErrors[field]);

    const fieldClassName = (field: keyof TransactionFormValues): string =>
        `w-full rounded-field border bg-surface px-3 py-2 text-fg ${hasError(field) ? "border-error" : "border-line"}`;

    return (
        <form onSubmit={handleSubmit} noValidate>
            <FormField label="Tipo" htmlFor="type" error={fieldErrors.type}>
                <select
                    id="type"
                    value={values.type}
                    onChange={handleChange("type")}
                    disabled={loading}
                    className={fieldClassName("type")}
                >
                    <option value="">Seleccioná un tipo</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                </select>
            </FormField>

            <FormField
                label="Monto"
                htmlFor="amount"
                error={fieldErrors.amount}
            >
                <input
                    id="amount"
                    type="number"
                    value={values.amount}
                    onChange={handleChange("amount")}
                    disabled={loading}
                    className={fieldClassName("amount")}
                />
            </FormField>

            <FormField
                label="Fuente de dinero"
                htmlFor="moneySourceId"
                error={fieldErrors.moneySourceId}
            >
                <select
                    id="moneySourceId"
                    value={values.moneySourceId}
                    onChange={handleChange("moneySourceId")}
                    disabled={loading}
                    className={fieldClassName("moneySourceId")}
                >
                    <option value="">Seleccioná una fuente</option>
                    {moneySourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Moneda"
                htmlFor="currency"
                error={fieldErrors.currency}
            >
                <select
                    id="currency"
                    value={values.currency}
                    onChange={handleChange("currency")}
                    disabled={loading}
                    className={fieldClassName("currency")}
                >
                    <option value="">Seleccioná una moneda</option>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                </select>
            </FormField>

            <FormField
                label="Categoría"
                htmlFor="categoryId"
                error={fieldErrors.categoryId}
            >
                <select
                    id="categoryId"
                    value={values.categoryId}
                    onChange={handleChange("categoryId")}
                    disabled={loading}
                    className={fieldClassName("categoryId")}
                >
                    <option value="">Seleccioná una categoría</option>
                    {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Fecha (DD-MM-YYYY)"
                htmlFor="date"
                error={fieldErrors.date}
            >
                <input
                    id="date"
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={values.date}
                    onChange={handleChange("date")}
                    disabled={loading}
                    className={fieldClassName("date")}
                />
            </FormField>

            <FormField
                label="Descripción"
                htmlFor="description"
                error={fieldErrors.description}
            >
                <input
                    id="description"
                    type="text"
                    value={values.description}
                    onChange={handleChange("description")}
                    disabled={loading}
                    className={fieldClassName("description")}
                />
            </FormField>

            <Loader visible={loading} />

            {error ? <p role="alert">{error}</p> : null}
            {success ? <p>Transacción registrada correctamente</p> : null}

            <button
                type="submit"
                disabled={loading}
                className="rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50"
            >
                Confirmar
            </button>
        </form>
    );
};

export default TransactionForm;
