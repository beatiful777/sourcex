import { useI18n } from "@/lib/i18n";
import { translations, type Key } from "@/lib/translations";

const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Translates a status value from the database (open, in_progress, accepted ...). Unknown values are shown as they are. */
export function useStatus() {
  const { t } = useI18n();
  return (s: string | null | undefined): string => {
    if (!s) return "";
    const k = `st.${camel(s)}`;
    return k in translations.en ? t(k as Key) : s;
  };
}
