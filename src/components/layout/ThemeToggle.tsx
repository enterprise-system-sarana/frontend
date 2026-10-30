import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const isDark = resolvedTheme === "dark";
  const label = isDark ? t("theme.switch_to_light", "Switch to light mode") : t("theme.switch_to_dark", "Switch to dark mode");

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={
        className ??
        "flex items-center justify-center size-10 shrink-0 rounded-lg border border-border/70 bg-card shadow-2xs cursor-pointer hover:bg-muted/70 transition-all text-foreground"
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
