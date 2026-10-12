import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Globe2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SOURCEX" },
      { name: "description", content: "SOURCEX is a neutral B2B sourcing hub connecting buyers with verified apparel, textile and electronics manufacturers. Zero fake profiles." },
      { property: "og:title", content: "About — SOURCEX" },
      { property: "og:description", content: "A neutral B2B sourcing hub built on verified factories and honest, comparable quotes." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const PILLARS = [
  {
    icon: ShieldCheck,
    t: "Verified suppliers only",
    d: "Every factory in the directory applied, was reviewed by hand and approved before its listing went live. No placeholder companies, no invented production numbers — an honest empty directory beats a fake full one.",
  },
  {
    icon: Globe2,
    t: "Country-neutral hubs",
    d: "Sourcing hubs across Asia, Europe, the Americas and MENA & Africa are presented the same way, so you can compare capability on merit: cost, lead time, capacity, certifications.",
  },
  {
    icon: FileText,
    t: "Comparable quotes",
    d: "Buyers post one structured RFQ. Suppliers answer with unit price, lead time and a short note in the same format — so quotes can actually be compared side by side.",
  },
];

function LiveNumbers() {
  const { data: s, isPending, error } = useQuery({
    queryKey: ["public-platform-stats"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_platform_stats");
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const items = s
    ? ([["Verified factories", s.suppliers], ["Countries represented", s.countries], ["Open RFQs", s.open_rfqs], ["Quotes sent", s.quotes]] as const)
    : [];
  return (
    <section aria-labelledby="live-numbers" className="mt-10">
      <h2 id="live-numbers" className="font-semibold">Live numbers</h2>
      <p className="mt-1 text-sm text-muted-foreground">Counted from the database right now, not typed in. Zero means zero.</p>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">Couldn't load the numbers.</p>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          {isPending
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-xl border bg-subtle" />)
            : items.map(([label, value]) => (
                <div key={label} className="rounded-xl border p-4">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-3xl font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
        </dl>
      )}
    </section>
  );
}

function About() {
  return (
    <>
      <PageHeader eyebrow="About" title="About SOURCEX">
        A neutral B2B sourcing hub connecting buyers with verified manufacturing capability.
      </PageHeader>
      <div className="container-page max-w-3xl py-14">
        <div className="space-y-5 text-muted-foreground">
          <p>
            Sourcing today runs on outdated directories: thousands of listings, no way to tell a real factory from
            a reseller, and quotes that arrive as unstructured emails you can't compare.
          </p>
          <p>
            SOURCEX flips that. Suppliers can't buy their way in — they apply, a human reviews the factory details,
            and only approved manufacturers appear in the public directory. Buyers post one clear request for
            quotation, and verified factories in the matching hubs respond with comparable offers.
          </p>
          <p>
            The platform is built by a student founder and is in private beta. We list suppliers only after
            verification, and we would rather show an empty directory than a fake one.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.t} className="rounded-xl border bg-card p-6">
              <p.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
              <h2 className="mt-4 font-semibold">{p.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>

        <LiveNumbers />

        <div className="mt-10 rounded-xl border bg-subtle p-6">
          <h2 className="font-semibold">Get in touch</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions, partnership ideas or press: <a className="text-foreground underline underline-offset-4" href="mailto:zamick94@gmail.com">zamick94@gmail.com</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/rfq">Post an RFQ</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/become-a-supplier">Become a supplier</Link></Button>
          </div>
        </div>
      </div>
    </>
  );
}
