"use client";

import type { ChangeEvent, FormEvent } from "react";

import Loader from "@/components/Loader";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import type { TransactionFormValues } from "@/hooks/useCreateTransaction";
import type { SelectOption } from "@/models/Transaction.types";

type TransactionFormProps = {
  moneySourceOptions: SelectOption[];
  categoryOptions: SelectOption[];
};

const TransactionForm = ({ moneySourceOptions, categoryOptions }: TransactionFormProps): React.JSX.Element => {
  const { values, fieldErrors, loading, error, success, setFieldValue, submit } = useCreateTransaction();

  const handleChange =
    (field: keyof TransactionFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
      setFieldValue(field, event.target.value);
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="type">Tipo</label>
        <select id="type" value={values.type} onChange={handleChange("type")} disabled={loading}>
          <option value="">Seleccioná un tipo</option>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        {fieldErrors.type ? <p role="alert">{fieldErrors.type}</p> : null}
      </div>

      <div>
        <label htmlFor="amount">Monto</label>
        <input
          id="amount"
          type="number"
          value={values.amount}
          onChange={handleChange("amount")}
          disabled={loading}
        />
        {fieldErrors.amount ? <p role="alert">{fieldErrors.amount}</p> : null}
      </div>

      <div>
        <label htmlFor="moneySourceId">Fuente de dinero</label>
        <select
          id="moneySourceId"
          value={values.moneySourceId}
          onChange={handleChange("moneySourceId")}
          disabled={loading}
        >
          <option value="">Seleccioná una fuente</option>
          {moneySourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors.moneySourceId ? <p role="alert">{fieldErrors.moneySourceId}</p> : null}
      </div>

      <div>
        <label htmlFor="currency">Moneda</label>
        <select id="currency" value={values.currency} onChange={handleChange("currency")} disabled={loading}>
          <option value="">Seleccioná una moneda</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
        {fieldErrors.currency ? <p role="alert">{fieldErrors.currency}</p> : null}
      </div>

      <div>
        <label htmlFor="categoryId">Categoría</label>
        <select
          id="categoryId"
          value={values.categoryId}
          onChange={handleChange("categoryId")}
          disabled={loading}
        >
          <option value="">Seleccioná una categoría</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors.categoryId ? <p role="alert">{fieldErrors.categoryId}</p> : null}
      </div>

      <div>
        <label htmlFor="date">Fecha (DD-MM-YYYY)</label>
        <input
          id="date"
          type="text"
          placeholder="DD-MM-YYYY"
          value={values.date}
          onChange={handleChange("date")}
          disabled={loading}
        />
        {fieldErrors.date ? <p role="alert">{fieldErrors.date}</p> : null}
      </div>

      <div>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={values.description}
          onChange={handleChange("description")}
          disabled={loading}
        />
        {fieldErrors.description ? <p role="alert">{fieldErrors.description}</p> : null}
      </div>

      <Loader visible={loading} />

      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>Transacción registrada correctamente</p> : null}

      <button type="submit" disabled={loading}>
        Confirmar
      </button>
    </form>
  );
};

export default TransactionForm;
