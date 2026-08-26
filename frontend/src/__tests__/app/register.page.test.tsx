import { render, screen } from "@testing-library/react";

import RegisterPage from "@/app/register/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../../services/AuthService", () => ({
  AuthService: { registerUser: jest.fn() },
}));

describe("RegisterPage", () => {
  it("aplica los tokens semánticos de fondo y texto al contenedor principal", async () => {
    render(<RegisterPage />);

    const main = await screen.findByRole("main");

    expect(main).toHaveClass("bg-bg", "text-fg");
  });

  it("renderiza el formulario de registro con sus 4 campos", async () => {
    render(<RegisterPage />);

    expect(await screen.findByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
  });
});
