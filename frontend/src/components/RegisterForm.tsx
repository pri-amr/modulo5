"use client";

import type { ChangeEvent, FormEvent } from "react";

import FormField from "@/components/FormField";
import Loader from "@/components/Loader";
import { useRegisterUser } from "@/hooks/useRegisterUser";
import type { RegisterFormValues } from "@/hooks/useRegisterUser";

const RegisterForm = (): React.JSX.Element => {
  const { values, fieldErrors, loading, error, success, setFieldValue, submit } = useRegisterUser();

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      setFieldValue(field, event.target.value);
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submit();
  };

  const hasError = (field: keyof RegisterFormValues): boolean => Boolean(fieldErrors[field]);

  const fieldClassName = (field: keyof RegisterFormValues): string =>
    `w-full rounded-field border bg-surface px-3 py-2 text-lg text-fg ${hasError(field) ? "border-error" : "border-line"}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-[13px]" data-testid="register-form-fields">
        <FormField label="Nombre" htmlFor="name" error={fieldErrors.name} labelSize="base">
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={handleChange("name")}
            disabled={loading}
            className={fieldClassName("name")}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={fieldErrors.email} labelSize="base">
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={handleChange("email")}
            disabled={loading}
            className={fieldClassName("email")}
          />
        </FormField>

        <FormField label="Clave" htmlFor="password" error={fieldErrors.password} labelSize="base">
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={handleChange("password")}
            disabled={loading}
            className={fieldClassName("password")}
          />
        </FormField>

        <FormField
          label="Confirmar clave"
          htmlFor="confirmPassword"
          error={fieldErrors.confirmPassword}
          labelSize="base"
        >
          <input
            id="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange("confirmPassword")}
            disabled={loading}
            className={fieldClassName("confirmPassword")}
          />
        </FormField>
      </div>

      <Loader visible={loading} />

      {error ? (
        <div role="alert" className="rounded-field border border-error bg-error/[3%] px-4 py-3 text-error">
          {error}
        </div>
      ) : null}
      {success ? <p>Cuenta creada correctamente</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50"
      >
        Crear cuenta
      </button>
    </form>
  );
};

export default RegisterForm;
