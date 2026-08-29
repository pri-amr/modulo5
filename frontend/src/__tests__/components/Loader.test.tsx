import { render, screen } from "@testing-library/react";

import Loader from "@/components/Loader";

describe("Loader", () => {
  it("renderiza el spinner cuando visible es true", () => {
    render(<Loader visible />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("no renderiza nada cuando visible es false", () => {
    const { container } = render(<Loader visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene atributo style", () => {
    render(<Loader visible />);

    expect(screen.getByRole("status")).not.toHaveAttribute("style");
  });

  it("aplica la clase del token de acento", () => {
    render(<Loader visible />);

    expect(screen.getByRole("status")).toHaveClass("border-accent-blue");
  });

  it("test-block3-loader-fullscreen-overlay", () => {
    const { container } = render(<Loader visible />);

    const overlay = container.firstElementChild;

    expect(overlay).toHaveClass(
      "fixed",
      "inset-0",
      "z-[100]",
      "flex",
      "items-center",
      "justify-center",
      "bg-overlay/50",
    );
    expect(overlay).toContainElement(screen.getByRole("status"));
  });

  it("test-block3-loader-spinner-preserved", () => {
    render(<Loader visible />);

    const spinner = screen.getByRole("status");

    expect(spinner).toHaveAttribute("aria-label", "Cargando");
    expect(spinner).toHaveClass(
      "h-8",
      "w-8",
      "animate-spin",
      "rounded-full",
      "border-4",
      "border-accent-blue",
      "border-t-transparent",
    );
  });

  it("test-block3-loader-hidden-no-error-residual", () => {
    const { container, rerender } = render(<Loader visible />);

    expect(container.firstElementChild).toHaveClass("fixed", "bg-overlay/50");
    expect(screen.getByRole("status")).toBeInTheDocument();

    expect(() => rerender(<Loader visible={false} />)).not.toThrow();

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
