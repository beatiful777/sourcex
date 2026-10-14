import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { PageHeader, FoundingNetwork } from "@/components/blocks";
import { SampleRequestButton } from "@/components/sample-request-button";
import { InquiryDialog } from "@/components/inquiry-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  country: z.string().optional().catch(undefined),
});

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
  const { q = "", category, country } = Route.useSearch();
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
  const results = approved.filter(
    (s) =>
      (!q || s.company_name.toLowerCase().includes(q.toLowerCase())) &&
      (!category || s.categories.includes(category)) &&
      (!country || s.country === country),
  );

  return (
    <>
      <PageHeader eyebrow="Directory" title="Find suppliers">
        Only factories that applied, were reviewed and approved by our team. Nothing is listed automatically.
      </PageHeader>
      <div className="container-page py-12">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : approved.length === 0 ? (
          <FoundingNetwork />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-8">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</h3>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <Chip active={!category} onClick={() => set({ category: undefined })}>All</Chip>
                  {CATEGORIES.map((c) => (
                    <Chip key={c.slug} active={category === c.name} onClick={() => set({ category: c.name })}>{c.name}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country</h3>
                <select
                  value={country ?? ""}
                  onChange={(e) => set({ country: e.target.value || undefined })}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">All countries</option>
                  {COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </aside>
            <div>
              <div className="mb-6 flex items-center gap-2 rounded-lg border px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  defaultValue={q}
                  onChange={(e) => set({ q: e.target.value || undefined })}
                  placeholder="Search factories…"
                  className="h-10 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {results.length} approved {results.length === 1 ? "factory" : "factories"}
              </p>
              {results.length === 0 ? (
                <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No approved factory matches this filter yet.
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
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[s.city, s.country].filter(Boolean).join(", ") || "Location not disclosed"}
                      </p>
                      {s.categories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {s.categories.map((c) => (
                            <span key={c} className="rounded-md border px-2 py-0.5 text-xs">{c}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">
                        {s.min_order_quantity ? `MOQ: ${s.min_order_quantity}` : "MOQ on request"}
                        {s.certifications.length > 0 ? ` · ${s.certifications.join(", ")}` : ""}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <InquiryDialog
                          target={s.company_name}
                          trigger={<Button size="sm" className="justify-self-start">Request Quote</Button>}
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
