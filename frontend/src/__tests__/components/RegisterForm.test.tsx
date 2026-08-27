import { fireEvent, render, screen } from "@testing-library/react";

import RegisterForm from "@/components/RegisterForm";
import { AuthService } from "@/services/AuthService";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../services/AuthService", () => ({
  AuthService: { registerUser: jest.fn() },
}));

const mockedRegisterUser = AuthService.registerUser as jest.Mock;

const FIELD_LABELS = {
  name: "Nombre",
  email: "Email",
  password: "Clave",
  confirmPassword: "Confirmar clave",
};

const fillField = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const submitForm = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
};

const fillValidForm = (): void => {
  fillField(FIELD_LABELS.name, "Ana López");
  fillField(FIELD_LABELS.email, "ana@example.com");
  fillField(FIELD_LABELS.password, "password123");
  fillField(FIELD_LABELS.confirmPassword, "password123");
};

describe("RegisterForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("RegisterForm muestra un error por campo si faltan datos obligatorios (valida AC-06)", async () => {
    render(<RegisterForm />);

    submitForm();

    expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();
    expect(await screen.findByText("El email es requerido")).toBeInTheDocument();
    expect(await screen.findByText("La clave es requerida")).toBeInTheDocument();
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });

  it("test-block2-validation-message-clave-requerida", async () => {
    render(<RegisterForm />);

    submitForm();

    expect(await screen.findByText("La clave es requerida")).toBeInTheDocument();
  });

  it("test-block2-validation-message-clave-longitud", async () => {
    render(<RegisterForm />);

    fillField(FIELD_LABELS.name, "Ana López");
    fillField(FIELD_LABELS.email, "ana@example.com");
    fillField(FIELD_LABELS.password, "short1");
    fillField(FIELD_LABELS.confirmPassword, "short1");

    submitForm();

    expect(await screen.findByText("La clave debe tener al menos 8 caracteres")).toBeInTheDocument();
  });

  it("test-block2-validation-message-claves-no-coinciden", async () => {
    render(<RegisterForm />);

    fillField(FIELD_LABELS.name, "Ana López");
    fillField(FIELD_LABELS.email, "ana@example.com");
    fillField(FIELD_LABELS.password, "password123");
    fillField(FIELD_LABELS.confirmPassword, "otraPassword123");

    submitForm();

    expect(await screen.findByText("Las claves no coinciden")).toBeInTheDocument();
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });

  it("RegisterForm muestra el mensaje de éxito tras un registro exitoso (valida AC-01)", async () => {
    mockedRegisterUser.mockResolvedValueOnce({
      id: "user-1",
      name: "Ana López",
      email: "ana@example.com",
    });

    render(<RegisterForm />);

    fillValidForm();
    submitForm();

    expect(await screen.findByText("Cuenta creada correctamente")).toBeInTheDocument();
  });

  it("RegisterForm muestra un error genérico si el backend rechaza el registro (valida AC-07)", async () => {
    mockedRegisterUser.mockRejectedValueOnce(new Error("El email ya está registrado"));

    render(<RegisterForm />);

    fillValidForm();
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("El email ya está registrado");
  });

  it("test-block2-register-labels-clave", async () => {
    render(<RegisterForm />);

    expect(await screen.findByLabelText("Clave")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar clave")).toBeInTheDocument();
    expect(screen.queryByText("Contraseña", { exact: false })).not.toBeInTheDocument();
  });

  it("test-block2-error-banner-styled", async () => {
    mockedRegisterUser.mockRejectedValueOnce(new Error("El email ya está registrado"));

    render(<RegisterForm />);

    fillValidForm();
    submitForm();

    const banner = await screen.findByRole("alert");

    expect(banner.tagName).toBe("DIV");
    expect(banner).toHaveClass("border-error");
    expect(banner).toHaveTextContent("El email ya está registrado");
  });

  it("test-block2-input-font-size-lg", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Nombre")).toHaveClass("text-lg");
    expect(screen.getByLabelText("Email")).toHaveClass("text-lg");
    expect(screen.getByLabelText("Clave")).toHaveClass("text-lg");
    expect(screen.getByLabelText("Confirmar clave")).toHaveClass("text-lg");
  });

  it("test-block2-label-font-size-base", () => {
    render(<RegisterForm />);

    expect(screen.getByText("Nombre")).toHaveClass("text-base");
    expect(screen.getByText("Clave")).toHaveClass("text-base");
  });

  it("test-block2-field-spacing-13px", () => {
    render(<RegisterForm />);

    expect(screen.getByTestId("register-form-fields")).toHaveClass("space-y-[13px]");
  });
});
