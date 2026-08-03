import { act } from "@testing-library/react";

import type { useThemeStore as UseThemeStoreType } from "@/contexts/useThemeStore";

const STORAGE_KEY = "theme-preference";

type ThemeStoreModule = { useThemeStore: typeof UseThemeStoreType };

const persistLightTheme = (): void => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state: { theme: "light" }, version: 0 }),
  );
};

const requireFreshThemeStore = (): ThemeStoreModule => {
  let freshModule: ThemeStoreModule | undefined;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    freshModule = require("../../contexts/useThemeStore") as ThemeStoreModule;
  });

  return freshModule as ThemeStoreModule;
};

describe("useThemeStore — hidratación manual (skipHydration)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.resetModules();
  });

  it("no rehidrata sincrónicamente al cargar el módulo: mantiene el default aunque ya haya un valor persistido en localStorage (AC hidratación)", () => {
    persistLightTheme();

    const { useThemeStore } = requireFreshThemeStore();

    expect(useThemeStore.getState().theme).toBe("dark");
    expect(useThemeStore.getState().hasHydrated).toBe(false);
  });

  it("hasHydrated pasa de false a true solo tras invocar rehydrate(), y el theme refleja el valor persistido (AC hidratación)", async () => {
    persistLightTheme();

    const { useThemeStore } = requireFreshThemeStore();

    expect(useThemeStore.getState().hasHydrated).toBe(false);
    expect(useThemeStore.getState().theme).toBe("dark");

    await act(async () => {
      await useThemeStore.persist.rehydrate();
      useThemeStore.getState().setHasHydrated(true);
    });

    expect(useThemeStore.getState().hasHydrated).toBe(true);
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
