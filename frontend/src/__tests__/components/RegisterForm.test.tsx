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

  it("test-block2-form-fixed-width", () => {
    const { container } = render(<RegisterForm />);

    expect(container.querySelector("form")).toHaveClass("w-full");
  });

  it("test-block2-button-spacing-13px", () => {
    // space-y-[13px] de Tailwind solo pone margin-top entre hermanos DENTRO del mismo
    // contenedor. register-form-fields y register-form-actions son hermanos de <form>, así
    // que la separación entre el bloque de campos y el botón depende de que el propio <form>
    // tenga space-y-[13px] — no alcanza con que cada div interno lo tenga por separado.
    const { container } = render(<RegisterForm />);

    const button = screen.getByRole("button", { name: "Crear cuenta" });

    expect(button.closest('[data-testid="register-form-actions"]')).toHaveClass("space-y-[13px]");
    expect(container.querySelector("form")).toHaveClass("space-y-[13px]");
  });

  it("test-block2-button-centered-content-width", () => {
    render(<RegisterForm />);

    const button = screen.getByRole("button", { name: "Crear cuenta" });

    expect(button).toHaveClass("block", "mx-auto");
    expect(button).not.toHaveClass("w-full");
  });

  it("test-block2-input-radius-1rem", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Nombre")).toHaveClass("rounded-[1rem]");
    expect(screen.getByLabelText("Email")).toHaveClass("rounded-[1rem]");
    expect(screen.getByLabelText("Clave")).toHaveClass("rounded-[1rem]");
    expect(screen.getByLabelText("Confirmar clave")).toHaveClass("rounded-[1rem]");
  });

  it("test-block2-button-radius-1rem", async () => {
    render(<RegisterForm />);

    expect(screen.getByRole("button", { name: "Crear cuenta" })).toHaveClass("rounded-[1rem]");
  });

  it("test-block2-banner-radius-1rem", async () => {
    mockedRegisterUser.mockRejectedValueOnce(new Error("El email ya está registrado"));

    render(<RegisterForm />);

    fillValidForm();
    submitForm();

    const bannerText = await screen.findByText("El email ya está registrado");
    const banner = bannerText.closest('[role="alert"]') ?? bannerText;

    expect(banner).toHaveClass("rounded-[1rem]");
  });

  it("test-block2-banner-spacing-13px", async () => {
    // Mismo motivo que test-block2-button-spacing-13px: el banner es hermano del bloque de
    // campos a través de <form>, no de register-form-actions directamente, así que la
    // separación "arriba" del banner (AC-09) depende de space-y-[13px] en el propio <form>.
    mockedRegisterUser.mockRejectedValueOnce(new Error("El email ya está registrado"));

    const { container } = render(<RegisterForm />);

    fillValidForm();
    submitForm();

    const bannerText = await screen.findByText("El email ya está registrado");
    const banner = bannerText.closest('[role="alert"]') ?? bannerText;

    expect(banner.closest('[data-testid="register-form-actions"]')).toHaveClass("space-y-[13px]");
    expect(container.querySelector("form")).toHaveClass("space-y-[13px]");
  });

  it("test-block2-banner-text-wraps-no-expand", async () => {
    // AVISO: este test NO valida el wrap real del texto del banner ni la ausencia de layout
    // shift (AC-11) — jsdom no ejecuta ningún motor de layout, así que ese comportamiento no
    // es observable de forma automatizada en este entorno (getBoundingClientRect siempre da
    // 0 sin importar el CSS). Lo único que prueba es una regresión puntual: que, con el
    // banner de error largo visible, `<form>` sigue teniendo `w-full` (no se volvió
    // condicional al estado de error) y que el input de referencia conserva su propia clase
    // de ancho. AC-11 queda pendiente de verificación visual manual en navegador.
    mockedRegisterUser.mockRejectedValueOnce(
      new Error(
        "Este es un mensaje de error muy largo que simula un texto extenso devuelto por el backend cuando falla el alta de la cuenta de usuario, para verificar que el ancho de los campos no cambia",
      ),
    );

    const { container } = render(<RegisterForm />);

    fillValidForm();
    submitForm();

    await screen.findByText(/mensaje de error muy largo/);

    expect(container.querySelector("form")).toHaveClass("w-full");
    expect(screen.getByLabelText("Email")).toHaveClass("w-full");
  });
});
