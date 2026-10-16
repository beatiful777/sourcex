import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "sx_theme";

export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  // The saved theme is applied before first paint by a small script in the page head;
  // here we only read the current state so the icon matches.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable: theme just won't be remembered */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("hdr.theme")}
      title={t("hdr.theme")}
      className="grid h-8 w-8 place-items-center rounded-md border bg-background text-foreground hover:bg-muted"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
