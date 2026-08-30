import { render, screen, within } from "@testing-library/react";

import RegisterPage from "@/app/register/page";

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() })
}));

jest.mock("../../services/AuthService", () => ({
    AuthService: { registerUser: jest.fn() }
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
        expect(screen.getByLabelText("Clave")).toBeInTheDocument();
        expect(screen.getByLabelText("Confirmar clave")).toBeInTheDocument();
    });

    it("test-block1-register-page-uses-authlayout", async () => {
        render(<RegisterPage />);

        const contentPanel = await screen.findByTestId(
            "auth-layout-content-panel"
        );

        expect(
            within(contentPanel).getByRole("heading", { name: "Crear cuenta" })
        ).toBeInTheDocument();
        expect(
            within(contentPanel).getByLabelText("Nombre")
        ).toBeInTheDocument();
    });
});
