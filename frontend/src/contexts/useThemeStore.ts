import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

type ThemeStore = {
    theme: Theme;
    toggleTheme: () => void;
    hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set): ThemeStore => ({
            theme: "dark",
            toggleTheme: (): void => {
                set((state) => ({
                    theme: state.theme === "dark" ? "light" : "dark"
                }));
            },
            hasHydrated: false,
            setHasHydrated: (value: boolean): void => {
                set({ hasHydrated: value });
            }
        }),
        {
            name: "theme-preference",
            // El servidor siempre renderiza con el default. Rehidratar sincrónicamente al
            // importar el store (comportamiento por defecto de `persist`) haría que el
            // cliente arranque con el valor de localStorage ANTES del primer render de
            // React, produciendo un mismatch real de hidratación si el usuario tenía otro
            // tema guardado. `skipHydration` pospone la rehidratación a un efecto de
            // cliente explícito (ver useHydrateThemeStore), y `hasHydrated` le permite a
            // la UI renderizar un estado neutro hasta que esa rehidratación terminó.
            skipHydration: true,
            partialize: (state) => ({ theme: state.theme })
        }
    )
);
