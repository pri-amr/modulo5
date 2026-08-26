"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import * as yup from "yup";

import type { RegisterUserRequestDto } from "@/models/Auth.types";
import { AuthService } from "@/services/AuthService";
import { sanitizeInput } from "@/utils/sanitizeInput";

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterFormFieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

const INITIAL_VALUES: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const registerFormSchema = yup.object({
  name: yup.string().trim().required("El nombre es requerido"),
  email: yup.string().trim().email("El email no es válido").required("El email es requerido"),
  password: yup
    .string()
    .required("La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: yup
    .string()
    .required("La confirmación de contraseña es requerida")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});

type UseRegisterUserResult = {
  values: RegisterFormValues;
  fieldErrors: RegisterFormFieldErrors;
  loading: boolean;
  error: string | null;
  success: boolean;
  setFieldValue: (field: keyof RegisterFormValues, value: string) => void;
  submit: () => Promise<void>;
};

export const useRegisterUser = (): UseRegisterUserResult => {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<RegisterFormFieldErrors>({});
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

  const setFieldValue = useCallback((field: keyof RegisterFormValues, value: string): void => {
    setValues((previous) => ({ ...previous, [field]: value }));
  }, []);

  const submit = useCallback(async (): Promise<void> => {
    setError(null);
    setSuccess(false);

    let validated: yup.InferType<typeof registerFormSchema>;

    try {
      validated = await registerFormSchema.validate(values, { abortEarly: false });
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const nextFieldErrors: RegisterFormFieldErrors = {};

        validationError.inner.forEach((issue) => {
          const path = issue.path as keyof RegisterFormValues | undefined;
          if (path && !nextFieldErrors[path]) {
            nextFieldErrors[path] = issue.message;
          }
        });

        setFieldErrors(nextFieldErrors);
      }

      return;
    }

    setFieldErrors({});

    const dto: RegisterUserRequestDto = {
      name: sanitizeInput(validated.name),
      email: validated.email,
      password: validated.password,
      confirmPassword: validated.confirmPassword,
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    try {
      await AuthService.registerUser(dto, controller.signal);

      if (isMountedRef.current) {
        setValues(INITIAL_VALUES);
        setSuccess(true);
        router.push("/login");
      }
    } catch (submitError) {
      if (isMountedRef.current) {
        setError(submitError instanceof Error ? submitError.message : "Ocurrió un error inesperado");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [router, values]);

  return { values, fieldErrors, loading, error, success, setFieldValue, submit };
};
