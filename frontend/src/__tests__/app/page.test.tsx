import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

jest.mock("../../services/TransactionService", () => ({
  TransactionService: { createTransaction: jest.fn() },
}));

describe("HomePage", () => {
  it("aplica los tokens semánticos de fondo y texto al contenedor principal", async () => {
    render(<HomePage />);

    const main = await screen.findByRole("main");

    expect(main).toHaveClass("bg-bg", "text-fg");
  });

  it("no usa colores hardcodeados en el contenedor principal", async () => {
    render(<HomePage />);

    const main = await screen.findByRole("main");

    expect(main).not.toHaveAttribute("style");
    const hardcodedColorClass = main.className
      .split(" ")
      .some((className) => /^(bg|text)-\[#/.test(className));
    expect(hardcodedColorClass).toBe(false);
  });
});
