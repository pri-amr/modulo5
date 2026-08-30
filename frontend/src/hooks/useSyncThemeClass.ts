"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/contexts/useThemeStore";

export const useSyncThemeClass = (): void => {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
    }, [theme]);
};
