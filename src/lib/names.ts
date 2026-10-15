import { useMemo } from "react";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

type L = "ru" | "uz" | "zh";
type Entry = Record<L, { name: string; desc: string }>;

// Category names and one-line descriptions. The stored value (English name) never changes,
// only what the visitor reads on screen.
const CAT: Record<string, Entry> = {
  apparel: {
    ru: { name: "Одежда", desc: "Одежда, спортивная одежда, униформа" },
    uz: { name: "Kiyim-kechak", desc: "Kiyim-kechak, sport kiyimlari, forma" },
    zh: { name: "服装", desc: "成衣、运动服、制服" },
  },
  textiles: {
    ru: { name: "Текстиль", desc: "Ткани, пряжа, технический текстиль" },
    uz: { name: "To'qimachilik", desc: "Matolar, ip, texnik to'qimachilik" },
    zh: { name: "纺织品", desc: "面料、纱线、技术纺织品" },
  },
  electronics: {
    ru: { name: "Электроника", desc: "Компоненты, устройства, аксессуары" },
    uz: { name: "Elektronika", desc: "Komponentlar, qurilmalar, aksessuarlar" },
    zh: { name: "电子产品", desc: "元器件、设备、配件" },
  },
  furniture: {
    ru: { name: "Мебель", desc: "Мебель для дома и для проектов" },
    uz: { name: "Mebel", desc: "Uy va ob'ektlar uchun mebel" },
    zh: { name: "家具", desc: "家用及工程家具" },
  },
  "home-goods": {
    ru: { name: "Товары для дома", desc: "Кухонная утварь, декор, товары для дома" },
    uz: { name: "Uy-ro'zg'or buyumlari", desc: "Oshxona anjomlari, dekor, uy-ro'zg'or buyumlari" },
    zh: { name: "家居用品", desc: "厨具、装饰品、家居用品" },
  },
};

/** Localised country and category names for display. Falls back to English when unsure. */
export function useNames() {
  const { lang } = useI18n();
  return useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    if (lang !== "en") {
      try {
        dn = new Intl.DisplayNames([lang], { type: "region" });
      } catch {
        dn = null;
      }
    }
    const codeByName = new Map(COUNTRIES.map((c) => [c.name, c.code]));
    const slugByName = new Map(CATEGORIES.map((c) => [c.name, c.slug]));
    const entry = (slug: string | undefined) => (lang !== "en" && slug ? CAT[slug]?.[lang] : undefined);
    return {
      country(name: string): string {
        const code = codeByName.get(name);
        if (!dn || !code) return name;
        try {
          const r = dn.of(code);
          return r && r !== code ? r : name;
        } catch {
          return name;
        }
      },
      category(name: string): string {
        return entry(slugByName.get(name))?.name ?? name;
      },
      categoryBySlug(slug: string): string {
        return entry(slug)?.name ?? CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
      },
      categoryDesc(slug: string): string {
        return entry(slug)?.desc ?? CATEGORIES.find((c) => c.slug === slug)?.description ?? "";
      },
    };
  }, [lang]);
}
