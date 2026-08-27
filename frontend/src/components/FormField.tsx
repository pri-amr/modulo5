import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  labelSize?: "sm" | "base";
  children: ReactNode;
};

const LABEL_SIZE_CLASSES: Record<NonNullable<FormFieldProps["labelSize"]>, string> = {
  sm: "text-sm",
  base: "text-base",
};

const FormField = ({
  label,
  htmlFor,
  error,
  labelSize = "sm",
  children,
}: FormFieldProps): React.JSX.Element => (
  <div>
    <label htmlFor={htmlFor} className={`block ${LABEL_SIZE_CLASSES[labelSize]} font-medium`}>
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
