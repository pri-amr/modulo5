"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import * as yup from "yup";

import type {
    Currency,
    CreateTransactionRequestDto,
    TransactionType
} from "@/models/Transaction.types";
import { TransactionService } from "@/services/TransactionService";
import { sanitizeInput } from "@/utils/sanitizeInput";

const DATE_FORMAT_REGEX = /^\d{2}-\d{2}-\d{4}$/;

const isLeapYear = (year: number): boolean =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const isRealDate = (value: string | undefined): boolean => {
    if (!value || !DATE_FORMAT_REGEX.test(value)) {
        return false;
    }

    const [day, month, year] = value.split("-").map(Number);

    if (month < 1 || month > 12) {
        return false;
    }

    const daysInMonth = [
        31,
        isLeapYear(year) ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ];

    return day >= 1 && day <= daysInMonth[month - 1];
};

export type TransactionFormValues = {
    type: TransactionType | "";
    amount: string;
    moneySourceId: string;
    currency: Currency | "";
    categoryId: string;
    date: string;
    description: string;
};

export type TransactionFormFieldErrors = Partial<
    Record<keyof TransactionFormValues, string>
>;

const INITIAL_VALUES: TransactionFormValues = {
    type: "",
    amount: "",
    moneySourceId: "",
    currency: "",
    categoryId: "",
    date: "",
    description: ""
};

const transactionFormSchema = yup.object({
    type: yup
        .mixed<TransactionType>()
        .oneOf(["ingreso", "egreso"], "Seleccioná un tipo válido")
        .required("El tipo es requerido"),
    amount: yup
        .number()
        .typeError("El monto es requerido")
        .required("El monto es requerido")
        .moreThan(0, "El monto debe ser mayor a 0"),
    moneySourceId: yup
        .string()
        .trim()
        .required("La fuente de dinero es requerida"),
    currency: yup
        .mixed<Currency>()
        .oneOf(["ARS", "USD"], "Seleccioná una moneda válida")
        .required("La moneda es requerida"),
    categoryId: yup.string().trim().required("La categoría es requerida"),
    date: yup
        .string()
        .trim()
        .required("La fecha es requerida")
        .matches(DATE_FORMAT_REGEX, "La fecha debe tener el formato DD-MM-YYYY")
        .test(
            "es-fecha-real",
            "La fecha no corresponde a una fecha real",
            isRealDate
        ),
    description: yup
        .string()
        .trim()
        .required("La descripción es requerida")
        .max(500, "La descripción no puede superar los 500 caracteres")
});

type UseCreateTransactionResult = {
    values: TransactionFormValues;
    fieldErrors: TransactionFormFieldErrors;
    loading: boolean;
    error: string | null;
    success: boolean;
    setFieldValue: (field: keyof TransactionFormValues, value: string) => void;
    submit: () => Promise<void>;
};

export const useCreateTransaction = (): UseCreateTransactionResult => {
    const [values, setValues] = useState<TransactionFormValues>(INITIAL_VALUES);
    const [fieldErrors, setFieldErrors] = useState<TransactionFormFieldErrors>(
        {}
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        return (): void => {
            isMountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    const setFieldValue = useCallback(
        (field: keyof TransactionFormValues, value: string): void => {
            setValues((previous) => ({ ...previous, [field]: value }));
        },
        []
    );

    const submit = useCallback(async (): Promise<void> => {
        setError(null);
        setSuccess(false);

        let validated: yup.InferType<typeof transactionFormSchema>;

        try {
            validated = await transactionFormSchema.validate(values, {
                abortEarly: false
            });
        } catch (validationError) {
            if (validationError instanceof yup.ValidationError) {
                const nextFieldErrors: TransactionFormFieldErrors = {};

                validationError.inner.forEach((issue) => {
                    const path = issue.path as
                        keyof TransactionFormValues | undefined;
                    if (path && !nextFieldErrors[path]) {
                        nextFieldErrors[path] = issue.message;
                    }
                });

                setFieldErrors(nextFieldErrors);
            }

            return;
        }

        setFieldErrors({});

        const dto: CreateTransactionRequestDto = {
            type: validated.type,
            amount: validated.amount,
            moneySourceId: validated.moneySourceId,
            currency: validated.currency,
            categoryId: validated.categoryId,
            date: validated.date,
            description: sanitizeInput(validated.description)
        };

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);

        try {
            await TransactionService.createTransaction(dto, controller.signal);

            if (isMountedRef.current) {
                setValues(INITIAL_VALUES);
                setSuccess(true);
            }
        } catch (submitError) {
            if (isMountedRef.current) {
                setError(
                    submitError instanceof Error
                        ? submitError.message
                        : "Ocurrió un error inesperado"
                );
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
            abortControllerRef.current = null;
        }
    }, [values]);

    return {
        values,
        fieldErrors,
        loading,
        error,
        success,
        setFieldValue,
        submit
    };
};
