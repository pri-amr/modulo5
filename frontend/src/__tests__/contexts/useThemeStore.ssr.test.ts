/**
 * @jest-environment node
 *
 * Entorno "node" (sin window/document) para simular una carga SSR real, en la que
 * localStorage no existe todavía.
 */
import { useThemeStore } from "@/contexts/useThemeStore";

describe("useThemeStore en un contexto SSR", () => {
    it("inicializa en 'dark' sin lanzar error cuando no hay window/localStorage disponibles", () => {
        expect(useThemeStore.getState().theme).toBe("dark");
    });
});
