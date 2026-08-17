import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

const FormField = ({ label, htmlFor, error, children }: FormFieldProps): React.JSX.Element => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {label}
    </label>
    {children}
    {error ? (
      <p role="alert" className="mt-1 text-sm text-error">
        {error}
      </p>
    ) : null}
  </div>
);

export default FormField;
