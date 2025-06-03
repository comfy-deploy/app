import { createContext, useContext, useEffect, useState } from "react";
import { useIsBusinessAllowed } from "../hooks/use-current-plan";
import { useCurrentPlanQuery } from "../hooks/use-current-plan";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isBusinessAllowed: boolean;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isBusinessAllowed: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const isBusinessAllowed = Boolean(useIsBusinessAllowed());
  const { isLoading } = useCurrentPlanQuery();

  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme =
      (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    return storedTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    // Don't apply business restrictions while loading
    if (isLoading) {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
      return;
    }

    // Force light theme for non-business users (only after loading)
    if (!isBusinessAllowed) {
      root.classList.add("light");
      return;
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, isBusinessAllowed, isLoading]);

  // Update theme when business plan status changes (only after loading)
  useEffect(() => {
    if (
      !isLoading &&
      !isBusinessAllowed &&
      (theme === "dark" || theme === "system")
    ) {
      setTheme("light");
      localStorage.setItem(storageKey, "light");
    }
  }, [isBusinessAllowed, theme, storageKey, isLoading]);

  const value = {
    theme,
    isBusinessAllowed,
    setTheme: (newTheme: Theme) => {
      // Don't restrict while loading
      if (isLoading) {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
        return;
      }

      // Restrict dark theme and system theme to business users only
      if (
        !isBusinessAllowed &&
        (newTheme === "dark" || newTheme === "system")
      ) {
        return; // Don't allow theme change
      }

      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
