import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppTheme = "default" | "terminal";

interface ThemeState {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "default",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "default" ? "terminal" : "default" })),
    }),
    { name: "finflow-theme" },
  ),
);
