import React from "react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const order: Array<typeof theme> = ["light", "dark", "system"];
    const idx = order.indexOf(theme as any);
    const nextTheme = order[(idx + 1) % order.length];
    setTheme(nextTheme);
  };

  return (
    <button
      aria-label="Toggle theme"
      onClick={next}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "var(--card)",
        color: "var(--card-foreground)",
      }}
    >
      {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}
    </button>
  );
};

export default ThemeToggle;
