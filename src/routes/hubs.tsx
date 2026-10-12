import { createFileRoute } from "@tanstack/react-router";
import { COUNTRIES, REGIONS } from "@/lib/catalog";
import { CountryCard, PageHeader } from "@/components/blocks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HubMap, type HubCount } from "@/components/hub-map";

export const Route = createFileRoute("/hubs")({
  head: () => ({
    meta: [
      { title: "Country Hubs — SOURCEX" },
      { name: "description", content: `Explore verified suppliers by country across Asia, Europe, the Americas, MENA & Africa — ${COUNTRIES.length} sourcing hubs on SOURCEX.` },
      { property: "og:title", content: "Country Hubs — SOURCEX" },
      { property: "og:description", content: `Each hub groups manufacturing capability by country. ${COUNTRIES.length} hubs across four regions.` },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/hubs" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/hubs" }],
  }),
  component: Hubs,
});


function Hubs() {
  // Real data only: approved factories are the only rows visible to the public (RLS), grouped by country.
  const { data: hubs, isLoading } = useQuery({
    queryKey: ["hub-map"],
    queryFn: async (): Promise<HubCount[]> => {
      const { data, error } = await supabase.from("supplier_applications").select("country").eq("status", "approved");
      if (error) throw error;
      const m = new Map<string, number>();
      for (const r of data ?? []) if (r.country) m.set(r.country, (m.get(r.country) ?? 0) + 1);
      return [...m].map(([country, count]) => ({ country, count })).sort((a, b) => a.country.localeCompare(b.country));
    },
  });
  return (
    <>
      <PageHeader eyebrow="Explore by region" title="Country Hubs">
        Each hub groups manufacturing capability by country. Explore verified suppliers by region.
      </PageHeader>
      <div className="container-page space-y-12 py-14">
        <section aria-labelledby="hub-map-h">
          <h2 id="hub-map-h" className="mb-4 text-sm font-semibold text-muted-foreground">Where approved factories are</h2>
          {isLoading ? <div className="h-64 animate-pulse rounded-xl border bg-muted/30" /> : <HubMap hubs={hubs ?? []} />}
        </section>
        {REGIONS.map((r) => {
          const regionHubs = COUNTRIES.filter((c) => c.region === r);
          return (
            <section key={r}>
              <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{r} · {regionHubs.length} hubs</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {regionHubs.map((c) => <CountryCard key={c.slug} c={c} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
