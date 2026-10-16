import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { PageHeader, FoundingNetwork } from "@/components/blocks";
import { SampleRequestButton } from "@/components/sample-request-button";
import { InquiryDialog } from "@/components/inquiry-dialog";
import { FavoriteButton } from "@/components/favorite-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n, fmt } from "@/lib/i18n";
import { useNames } from "@/lib/names";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  country: z.string().optional().catch(undefined),
  sort: z.enum(["new", "moq", "name"]).optional().catch(undefined),
  moq: z.enum(["100", "500", "1000", "5000", "10000"]).optional().catch(undefined),
});

const MOQ_STEPS = [100, 500, 1000, 5000, 10000];

/** Reads the first number from free text such as "1,000 pcs", "500 units" or "2k". Returns null if there is none. */
export function parseMoq(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(/\d[\d\s.,]*/);
  if (!m) return null;
  const raw = m[0].trim().replace(/[.,]$/, "");
  const after = text.slice((m.index ?? 0) + m[0].length);
  const thousands = /^\d{1,3}([.,\s]\d{3})+$/.test(raw);
  const n = thousands ? Number(raw.replace(/[.,\s]/g, "")) : Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return /^\s*k\b/i.test(after) ? n * 1000 : n;
}

export const Route = createFileRoute("/suppliers")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Find Suppliers — SOURCEX" },
      { name: "description", content: "Search approved manufacturers by keyword, category and country. Only factories we reviewed by hand." },
      { property: "og:title", content: "Find Suppliers — SOURCEX" },
      { property: "og:description", content: "Approved factories only — zero placeholder listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Suppliers,
});

type Factory = {
  id: string;
  company_name: string;
  country: string | null;
  city: string | null;
  categories: string[];
  min_order_quantity: string | null;
  certifications: string[];
  website_or_catalog: string | null;
  logo_url: string | null;
};

export function Suppliers() {
  const { t } = useI18n();
  const names = useNames();
  const { q = "", category, country, sort, moq } = Route.useSearch();
  const navigate = useNavigate({ from: "/suppliers" });
  const set = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (s) => ({ ...s, ...patch }), replace: true });

  const { data, isLoading } = useQuery({
    queryKey: ["approved-factories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_applications")
        .select("id, company_name, country, city, categories, min_order_quantity, certifications, website_or_catalog, logo_url")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Factory[];
    },
  });

  const approved = data ?? [];
  const maxMoq = moq ? Number(moq) : null;
  const moqOf = (f: Factory) => parseMoq(f.min_order_quantity);
  const filtered = approved.filter((s) => {
    if (q && !s.company_name.toLowerCase().includes(q.toLowerCase())) return false;
    if (category && !s.categories.includes(category)) return false;
    if (country && s.country !== country) return false;
    if (maxMoq !== null) {
      const m = moqOf(s);
      if (m === null || m > maxMoq) return false;
    }
    return true;
  });
  const results = [...filtered].sort((a, b) => {
    if (sort === "name") return a.company_name.localeCompare(b.company_name);
    if (sort === "moq") return (moqOf(a) ?? Infinity) - (moqOf(b) ?? Infinity) || a.company_name.localeCompare(b.company_name);
    return 0;
  });
  const filtersOn = !!(category || country || moq || sort);

  return (
    <>
      <PageHeader eyebrow={t("sp.eyebrow")} title={t("ft.findSuppliers")}>
        {t("sp.lead")}
      </PageHeader>
      <div className="container-page py-12">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("c.loading")}</p>
        ) : approved.length === 0 ? (
          <FoundingNetwork />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-8">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sp.category")}</h3>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <Chip active={!category} onClick={() => set({ category: undefined })}>{t("sp.all")}</Chip>
                  {CATEGORIES.map((c) => (
                    <Chip key={c.slug} active={category === c.name} onClick={() => set({ category: c.name })}>{names.category(c.name)}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sp.country")}</h3>
                <select
                  value={country ?? ""}
                  onChange={(e) => set({ country: e.target.value || undefined })}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">{t("sp.allCountries")}</option>
                  {COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{names.country(c.name)}</option>)}
                </select>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sp.moqMax")}</h3>
                <select
                  value={moq ?? ""}
                  onChange={(e) => set({ moq: (e.target.value || undefined) as typeof moq })}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">{t("sp.moqAny")}</option>
                  {MOQ_STEPS.map((n) => <option key={n} value={String(n)}>{fmt(t("sp.moqUpTo"), { n: n.toLocaleString() })}</option>)}
                </select>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sp.sort")}</h3>
                <select
                  value={sort ?? "new"}
                  onChange={(e) => set({ sort: e.target.value === "new" ? undefined : (e.target.value as typeof sort) })}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="new">{t("sp.sortNew")}</option>
                  <option value="moq">{t("sp.sortMoq")}</option>
                  <option value="name">{t("sp.sortName")}</option>
                </select>
              </div>
              {filtersOn && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => set({ category: undefined, country: undefined, moq: undefined, sort: undefined })}>
                  {t("sp.reset")}
                </Button>
              )}
            </aside>
            <div>
              <div className="mb-6 flex items-center gap-2 rounded-lg border px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  defaultValue={q}
                  onChange={(e) => set({ q: e.target.value || undefined })}
                  placeholder={t("sp.search")}
                  className="h-10 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {fmt(t("sp.count"), { n: results.length })}
              </p>
              {moq && <p className="-mt-2 mb-4 text-xs text-muted-foreground">{t("sp.moqNote")}</p>}
              {results.length === 0 ? (
                <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  {t("sp.none")}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.map((s) => (
                    <div key={s.id} className="flex flex-col rounded-xl border p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          {s.logo_url && s.logo_url.startsWith("https://") && (
                            <img src={s.logo_url} alt={`${s.company_name} logo`} className="h-10 w-10 shrink-0 rounded-md border object-contain" />
                          )}
                          <Link to="/factory/$id" params={{ id: s.id }} className="break-words font-medium hover:underline">{s.company_name}</Link>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <FavoriteButton supplierId={s.id} />
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                            <ShieldCheck className="h-3 w-3" /> {t("c.verified")}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[s.city, s.country ? names.country(s.country) : null].filter(Boolean).join(", ") || t("sp.location")}
                      </p>
                      {s.categories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {s.categories.map((c) => (
                            <span key={c} className="rounded-md border px-2 py-0.5 text-xs">{names.category(c)}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">
                        {s.min_order_quantity ? fmt(t("sp.moq"), { v: s.min_order_quantity }) : t("sp.moqOn")}
                        {s.certifications.length > 0 ? ` · ${s.certifications.join(", ")}` : ""}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <InquiryDialog
                          target={s.company_name}
                          trigger={<Button size="sm" className="justify-self-start">{t("sp.quote")}</Button>}
                        />
                        <SampleRequestButton supplierId={s.id} company={s.company_name} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-left text-sm transition-colors",
        active ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
