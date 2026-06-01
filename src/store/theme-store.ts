"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

type ThemeState = {
  theme: Theme;
  preference: ThemePreference;
  hydrated: boolean;
  setTheme: (theme: Theme) => void;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  setHydrated: (hydrated: boolean) => void;
};

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(preference: ThemePreference): Theme {
  return preference === "system" ? getSystemTheme() : preference;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      preference: "system",
      hydrated: false,

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme, preference: theme });
      },

      setPreference: (preference) => {
        const theme = resolveTheme(preference);
        applyTheme(theme);
        set({ preference, theme });
      },

      toggleTheme: () => {
        const nextTheme = get().theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        set({ theme: nextTheme, preference: nextTheme });
      },

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "ecobus-theme",
      onRehydrateStorage: () => (state) => {
        const preference = state?.preference ?? state?.theme ?? "system";
        const theme = resolveTheme(preference);
        applyTheme(theme);
        if (state) {
          state.preference = preference;
          state.theme = theme;
        }
        state?.setHydrated(true);
      },
    }
  )
);

if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const { preference, setPreference } = useThemeStore.getState();
      if (preference === "system") setPreference("system");
    });
}
