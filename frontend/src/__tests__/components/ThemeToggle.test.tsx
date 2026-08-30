import { act, render, screen } from "@testing-library/react";

import ThemeToggle from "@/components/ThemeToggle";
import { useThemeStore } from "@/contexts/useThemeStore";

describe("ThemeToggle", () => {
    beforeEach(() => {
        useThemeStore.setState({ theme: "dark", hasHydrated: false });
    });

    it("mientras hasHydrated es false renderiza un estado neutro, sin ícono ni aria-label dependiente del tema", () => {
        render(<ThemeToggle />);

        expect(
            screen.queryByLabelText("Cambiar a modo claro")
        ).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText("Cambiar a modo oscuro")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("🌙")).not.toBeInTheDocument();
        expect(screen.queryByText("☀️")).not.toBeInTheDocument();
    });

    it("una vez hasHydrated es true, renderiza el ícono y aria-label reales según el theme persistido", () => {
        render(<ThemeToggle />);

        act(() => {
            useThemeStore.setState({ theme: "light", hasHydrated: true });
        });

        expect(
            screen.getByLabelText("Cambiar a modo oscuro")
        ).toBeInTheDocument();
        expect(screen.getByText("☀️")).toBeInTheDocument();
    });

    it("el botón hidratado tiene las clases de posicionamiento, forma y color de FR-02", () => {
        render(<ThemeToggle />);

        act(() => {
            useThemeStore.setState({ theme: "light", hasHydrated: true });
        });

        expect(screen.getByLabelText("Cambiar a modo oscuro")).toHaveClass(
            "fixed",
            "right-4",
            "top-4",
            "z-50",
            "flex",
            "h-10",
            "w-10",
            "items-center",
            "justify-center",
            "rounded-full",
            "bg-surface-muted",
            "text-fg",
            "shadow",
            "hover:bg-accent-blue",
            "hover:text-white"
        );
    });

    it("el botón en estado !hasHydrated también tiene las clases de posicionamiento, forma y color de FR-02", () => {
        render(<ThemeToggle />);

        expect(
            screen.getByLabelText("Cargando preferencia de tema")
        ).toHaveClass(
            "fixed",
            "right-4",
            "top-4",
            "z-50",
            "flex",
            "h-10",
            "w-10",
            "items-center",
            "justify-center",
            "rounded-full",
            "bg-surface-muted",
            "text-fg",
            "shadow",
            "hover:bg-accent-blue",
            "hover:text-white"
        );
    });
});
