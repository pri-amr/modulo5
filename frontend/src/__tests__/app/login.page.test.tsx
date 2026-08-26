import { render, screen } from "@testing-library/react";

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("la página /login muestra el placeholder sin un formulario funcional (alcance acotado de FR-07)", () => {
    render(<LoginPage />);

    const main = screen.getByRole("main");

    expect(main).toHaveClass("bg-bg", "text-fg");
    expect(screen.getByText(/estará disponible próximamente/i)).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
  });
});
