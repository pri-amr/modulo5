"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/contexts/useThemeStore";

// El store usa `skipHydration: true` (ver useThemeStore.ts) para evitar que zustand
// rehidrate localStorage de forma síncrona antes del primer render del cliente. Este
// hook dispara esa rehidratación manualmente, una sola vez, tras el montaje.
export const useHydrateThemeStore = (): void => {
  useEffect(() => {
    let isMounted = true;

    void Promise.resolve(useThemeStore.persist.rehydrate()).then(() => {
      if (isMounted) {
        useThemeStore.getState().setHasHydrated(true);
      }
    });

    return (): void => {
      isMounted = false;
    };
  }, []);
};
