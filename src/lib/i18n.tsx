import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Key, type Lang } from "./translations";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => translations.en[k] });

const STORAGE_KEY = "sx_lang";
const isLang = (v: unknown): v is Lang => v === "en" || v === "ru" || v === "uz" || v === "zh";

export function I18nProvider({ children }: { children: ReactNode }) {
  // Server and first client render use English so hydration matches; the saved
  // or browser language is applied right after mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let next: Lang = "en";
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLang(saved)) next = saved;
      else {
        const nav = (navigator.language || "").toLowerCase();
        if (nav.startsWith("ru")) next = "ru";
        else if (nav.startsWith("uz")) next = "uz";
        else if (nav.startsWith("zh")) next = "zh";
      }
    } catch {
      /* storage unavailable: stay on English */
    }
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((k: Key) => translations[lang][k] ?? translations.en[k] ?? k, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
