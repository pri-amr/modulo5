import { act, render, screen } from "@testing-library/react";

import ThemeToggle from "@/components/ThemeToggle";
import { useThemeStore } from "@/contexts/useThemeStore";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark", hasHydrated: false });
  });

  it("mientras hasHydrated es false renderiza un estado neutro, sin ícono ni aria-label dependiente del tema", () => {
    render(<ThemeToggle />);

    expect(screen.queryByLabelText("Cambiar a modo claro")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cambiar a modo oscuro")).not.toBeInTheDocument();
    expect(screen.queryByText("🌙")).not.toBeInTheDocument();
    expect(screen.queryByText("☀️")).not.toBeInTheDocument();
  });

  it("una vez hasHydrated es true, renderiza el ícono y aria-label reales según el theme persistido", () => {
    render(<ThemeToggle />);

    act(() => {
      useThemeStore.setState({ theme: "light", hasHydrated: true });
    });

    expect(screen.getByLabelText("Cambiar a modo oscuro")).toBeInTheDocument();
    expect(screen.getByText("☀️")).toBeInTheDocument();
  });
});
