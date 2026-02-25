import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      return stored ?? "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    const apply = (t: Theme) => {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = t === "dark" || (t === "system" && prefersDark);
      if (isDark) root.classList.add("dark");
      else root.classList.remove("dark");
    };

    apply(theme);

    try {
      localStorage.setItem("theme", theme);
    } catch {}

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") apply("system");
    };

    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler as any);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler as any);
    };
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
