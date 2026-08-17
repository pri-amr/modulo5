"use client";

import { useHydrateThemeStore } from "@/hooks/useHydrateThemeStore";
import { useSyncThemeClass } from "@/hooks/useSyncThemeClass";

const ThemeSync = (): null => {
  useHydrateThemeStore();
  useSyncThemeClass();

  return null;
};

export default ThemeSync;
