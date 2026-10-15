import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/translations";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
  { value: "uz", label: "UZ" },
  { value: "zh", label: "中文" },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={t("hdr.language")}
      className="h-8 rounded-md border bg-background px-1.5 text-xs font-medium text-foreground"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
