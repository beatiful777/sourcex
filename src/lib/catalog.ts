import { Shirt, Layers, Cpu, Armchair, Lamp, type LucideIcon } from "lucide-react";

export type Category = { slug: string; name: string; description: string; icon: LucideIcon };

export const CATEGORIES: Category[] = [
  { slug: "apparel", name: "Apparel", description: "Garments, activewear, uniforms", icon: Shirt },
  { slug: "textiles", name: "Textiles", description: "Fabrics, yarns, technical textiles", icon: Layers },
  { slug: "electronics", name: "Electronics", description: "Components, devices, accessories", icon: Cpu },
  { slug: "furniture", name: "Furniture", description: "Residential and contract furniture", icon: Armchair },
  { slug: "home-goods", name: "Home Goods", description: "Kitchenware, décor, housewares", icon: Lamp },
];

export type Country = {
  slug: string;
  name: string;
  code: string;
  region: string;
  strengths: string[];
};

export const COUNTRIES: Country[] = [
  { slug: "china", name: "China", code: "CN", region: "Asia", strengths: ["electronics", "furniture", "home-goods"] },
  { slug: "india", name: "India", code: "IN", region: "Asia", strengths: ["textiles", "apparel", "home-goods"] },
  { slug: "vietnam", name: "Vietnam", code: "VN", region: "Asia", strengths: ["apparel", "furniture", "electronics"] },
  { slug: "bangladesh", name: "Bangladesh", code: "BD", region: "Asia", strengths: ["apparel", "textiles"] },
  { slug: "indonesia", name: "Indonesia", code: "ID", region: "Asia", strengths: ["furniture", "apparel", "textiles"] },
  { slug: "pakistan", name: "Pakistan", code: "PK", region: "Asia", strengths: ["textiles", "apparel", "home-goods"] },
  { slug: "thailand", name: "Thailand", code: "TH", region: "Asia", strengths: ["electronics", "home-goods"] },
  { slug: "turkey", name: "Turkey", code: "TR", region: "Asia", strengths: ["textiles", "apparel", "furniture"] },
  { slug: "philippines", name: "Philippines", code: "PH", region: "Asia", strengths: ["electronics", "furniture"] },
  { slug: "cambodia", name: "Cambodia", code: "KH", region: "Asia", strengths: ["apparel", "textiles"] },
  { slug: "malaysia", name: "Malaysia", code: "MY", region: "Asia", strengths: ["electronics", "furniture"] },
  { slug: "south-korea", name: "South Korea", code: "KR", region: "Asia", strengths: ["electronics", "textiles"] },
  { slug: "taiwan", name: "Taiwan", code: "TW", region: "Asia", strengths: ["electronics", "textiles"] },
  { slug: "japan", name: "Japan", code: "JP", region: "Asia", strengths: ["electronics", "home-goods"] },
  { slug: "portugal", name: "Portugal", code: "PT", region: "Europe", strengths: ["textiles", "apparel", "home-goods"] },
  { slug: "poland", name: "Poland", code: "PL", region: "Europe", strengths: ["furniture", "electronics"] },
  { slug: "italy", name: "Italy", code: "IT", region: "Europe", strengths: ["apparel", "furniture", "textiles"] },
  { slug: "spain", name: "Spain", code: "ES", region: "Europe", strengths: ["apparel", "home-goods"] },
  { slug: "germany", name: "Germany", code: "DE", region: "Europe", strengths: ["electronics", "home-goods"] },
  { slug: "romania", name: "Romania", code: "RO", region: "Europe", strengths: ["apparel", "furniture"] },
  { slug: "bulgaria", name: "Bulgaria", code: "BG", region: "Europe", strengths: ["apparel", "textiles"] },
  { slug: "czech-republic", name: "Czech Republic", code: "CZ", region: "Europe", strengths: ["electronics", "home-goods"] },
  { slug: "lithuania", name: "Lithuania", code: "LT", region: "Europe", strengths: ["furniture", "textiles"] },
  { slug: "greece", name: "Greece", code: "GR", region: "Europe", strengths: ["apparel", "textiles"] },
  { slug: "mexico", name: "Mexico", code: "MX", region: "Americas", strengths: ["electronics", "furniture", "apparel"] },
  { slug: "usa", name: "USA", code: "US", region: "Americas", strengths: ["electronics", "furniture", "home-goods"] },
  { slug: "brazil", name: "Brazil", code: "BR", region: "Americas", strengths: ["furniture", "apparel", "home-goods"] },
  { slug: "colombia", name: "Colombia", code: "CO", region: "Americas", strengths: ["apparel", "textiles"] },
  { slug: "honduras", name: "Honduras", code: "HN", region: "Americas", strengths: ["apparel", "textiles"] },
  { slug: "guatemala", name: "Guatemala", code: "GT", region: "Americas", strengths: ["apparel", "textiles"] },
  { slug: "morocco", name: "Morocco", code: "MA", region: "MENA & Africa", strengths: ["apparel", "textiles", "home-goods"] },
  { slug: "tunisia", name: "Tunisia", code: "TN", region: "MENA & Africa", strengths: ["apparel", "textiles"] },
  { slug: "egypt", name: "Egypt", code: "EG", region: "MENA & Africa", strengths: ["textiles", "apparel"] },
  { slug: "jordan", name: "Jordan", code: "JO", region: "MENA & Africa", strengths: ["apparel"] },
  { slug: "ethiopia", name: "Ethiopia", code: "ET", region: "MENA & Africa", strengths: ["apparel", "textiles"] },
  { slug: "kenya", name: "Kenya", code: "KE", region: "MENA & Africa", strengths: ["apparel", "textiles"] },
];

export const REGIONS = ["Asia", "Europe", "Americas", "MENA & Africa"];

export function flagEmoji(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function filterCountries(query: string, category: string | null) {
  const q = query.trim().toLowerCase();
  return COUNTRIES.filter((c) => {
    const matchesCat = !category || c.strengths.includes(category);
    const matchesQ =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.strengths.some((s) => categoryName(s).toLowerCase().includes(q));
    return matchesCat && matchesQ;
  });
}

/** Real supplier records. Intentionally empty while the platform is in beta. */
export type Supplier = { id: string; name: string; country: string; category: string };
export const SUPPLIERS: Supplier[] = [];

export function flagUrl(code: string) {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}
