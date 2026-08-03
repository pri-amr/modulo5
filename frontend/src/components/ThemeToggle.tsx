"use client";

import { useThemeStore } from "@/contexts/useThemeStore";

const ThemeToggle = (): React.JSX.Element => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);

  // Hasta que el store termine de rehidratarse (ver useHydrateThemeStore), el HTML
  // del cliente debe coincidir con el que renderizó el servidor: ni ícono ni
  // aria-label pueden depender de `theme` todavía, o React reporta un mismatch de
  // hidratación real.
  if (!hasHydrated) {
    return (
      <button type="button" disabled aria-label="Cargando preferencia de tema">
        {" "}
      </button>
    );
  }

  const label = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button type="button" onClick={toggleTheme} aria-label={label}>
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;
