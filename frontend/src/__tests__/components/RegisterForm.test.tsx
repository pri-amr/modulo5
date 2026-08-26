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
  password: "Contraseña",
  confirmPassword: "Confirmar contraseña",
};

const fillField = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const submitForm = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
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
    expect(await screen.findByText("La contraseña es requerida")).toBeInTheDocument();
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });

  it("RegisterForm muestra un error si las contraseñas no coinciden (valida AC-05)", async () => {
    render(<RegisterForm />);

    fillField(FIELD_LABELS.name, "Ana López");
    fillField(FIELD_LABELS.email, "ana@example.com");
    fillField(FIELD_LABELS.password, "password123");
    fillField(FIELD_LABELS.confirmPassword, "otraPassword123");

    submitForm();

    expect(await screen.findByText("Las contraseñas no coinciden")).toBeInTheDocument();
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });

  it("RegisterForm muestra el mensaje de éxito tras un registro exitoso (valida AC-01)", async () => {
    mockedRegisterUser.mockResolvedValueOnce({
      id: "user-1",
      name: "Ana López",
      email: "ana@example.com",
    });

    render(<RegisterForm />);

    fillField(FIELD_LABELS.name, "Ana López");
    fillField(FIELD_LABELS.email, "ana@example.com");
    fillField(FIELD_LABELS.password, "password123");
    fillField(FIELD_LABELS.confirmPassword, "password123");

    submitForm();

    expect(await screen.findByText("Cuenta creada correctamente")).toBeInTheDocument();
  });

  it("RegisterForm muestra un error genérico si el backend rechaza el registro (valida AC-07)", async () => {
    mockedRegisterUser.mockRejectedValueOnce(new Error("El email ya está registrado"));

    render(<RegisterForm />);

    fillField(FIELD_LABELS.name, "Ana López");
    fillField(FIELD_LABELS.email, "ana@example.com");
    fillField(FIELD_LABELS.password, "password123");
    fillField(FIELD_LABELS.confirmPassword, "password123");

    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("El email ya está registrado");
  });
});
