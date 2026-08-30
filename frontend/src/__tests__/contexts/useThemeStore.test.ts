import { useThemeStore } from "@/contexts/useThemeStore";

const readPersistedTheme = (): unknown => {
    const raw = window.localStorage.getItem("theme-preference");

    return raw === null ? null : JSON.parse(raw).state.theme;
};

describe("useThemeStore", () => {
    it("inicializa theme en 'dark' cuando no hay preferencia guardada (AC-11)", () => {
        expect(window.localStorage.getItem("theme-preference")).toBeNull();
        expect(useThemeStore.getState().theme).toBe("dark");
    });

    it("toggleTheme() alterna entre 'dark' y 'light' y lo persiste en localStorage (AC-12)", () => {
        expect(useThemeStore.getState().theme).toBe("dark");

        useThemeStore.getState().toggleTheme();

        expect(useThemeStore.getState().theme).toBe("light");
        expect(readPersistedTheme()).toBe("light");

        useThemeStore.getState().toggleTheme();

        expect(useThemeStore.getState().theme).toBe("dark");
        expect(readPersistedTheme()).toBe("dark");
    });
});
