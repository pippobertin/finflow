"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";

export function ThemeApplicator() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "terminal") {
      html.setAttribute("data-theme", "terminal");
      html.classList.add("dark");
    } else {
      html.removeAttribute("data-theme");
      html.classList.remove("dark");
    }
  }, [theme]);

  return null;
}
