import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FileText, MessagesSquare, PackageCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, filterCountries, categoryName } from "@/lib/catalog";
import { CountryCard, SuppliersEmpty } from "@/components/blocks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOURCEX — Source Smarter. Global B2B Sourcing Hub" },
      { name: "description", content: "Explore verified manufacturing hubs across Asia, Europe, the Americas and MENA & Africa. Post an RFQ, get comparable quotes from verified factories, source smart." },
      { property: "og:title", content: "SOURCEX — Global B2B Sourcing Hub" },
      { property: "og:description", content: "Global B2B sourcing hub. Post an RFQ, get quotes, source smart." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const hubs = filterCountries(query, category);
  const filtering = query.trim() !== "" || category !== null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    document.getElementById("hubs")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-page relative py-20 text-center md:py-28">
          <p className="eyebrow">Global B2B Sourcing Hub</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Source Smarter.
            <span className="block text-muted-foreground">Global B2B Sourcing Hub</span>
          </h1>
          <form onSubmit={submit} className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-xl border bg-background p-1.5">
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a country, region or category…"
              aria-label="Search"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" aria-label="Clear" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <Button type="submit" className="h-10 px-5">Search</Button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            Popular:
            {["Textiles", "Vietnam", "Electronics", "Europe"].map((t) => (
              <button key={t} onClick={() => setQuery(t)} className="underline-offset-4 hover:text-foreground hover:underline">{t}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-20">
        <SectionHead eyebrow="Categories" title="Browse by Category" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {CATEGORIES.map((c) => {
            const active = category === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => {
                  setCategory(active ? null : c.slug);
                  document.getElementById("hubs")?.scrollIntoView({ behavior: "smooth" });
                }}
                aria-pressed={active}
                className={cn(
                  "group rounded-xl border p-5 text-left transition-colors hover:border-primary/40",
                  active ? "border-primary bg-accent" : "bg-card",
                )}
              >
                <c.icon className={cn("h-5 w-5", active ? "text-primary" : "text-foreground")} strokeWidth={1.6} />
                <div className="mt-6 text-sm font-medium">{c.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Hubs */}
      <section id="hubs" className="scroll-mt-20 border-y bg-subtle">
        <div className="container-page py-20">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHead eyebrow="Sourcing hubs" title="Sourcing Hubs" className="mb-0" />
            {filtering && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {hubs.length} hubs
                  {category && <> · {categoryName(category)}</>}
                  {query && <> · “{query}”</>}
                </span>
                <button onClick={() => { setQuery(""); setCategory(null); }} className="font-medium text-primary">Clear</button>
              </div>
            )}
          </div>
          {hubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {hubs.map((c) => <CountryCard key={c.slug} c={c} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-background py-12 text-center text-sm text-muted-foreground">
              No hubs match your search.{" "}
              <button onClick={() => { setQuery(""); setCategory(null); }} className="font-medium text-primary">Reset filters</button>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-20">
        <SectionHead eyebrow="Process" title="How SOURCEX Works" />
        <div className="grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
          {[
            { icon: FileText, t: "Post RFQ", d: "Describe your product, quantity, and target price in one structured request." },
            { icon: MessagesSquare, t: "Get Quotes", d: "Suppliers in relevant hubs respond with comparable, itemized quotes." },
            { icon: PackageCheck, t: "Source Smart", d: "Compare across countries on cost, lead time, and capability — then decide." },
          ].map((s, i) => (
            <div key={s.t} className="bg-background p-8">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-8 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          <Button asChild><Link to="/rfq">Post an RFQ</Link></Button>
          <Button variant="outline" onClick={() => navigate({ to: "/how-it-works" })}>Learn more</Button>
        </div>
      </section>

      {/* Featured suppliers */}
      <section className="container-page pb-24">
        <SectionHead eyebrow="Featured suppliers" title="Featured Suppliers" />
        <SuppliersEmpty note="Platform in private beta. Suppliers appear here only after verification." />
      </section>
    </>
  );
}

function SectionHead({ eyebrow, title, className }: { eyebrow: string; title: string; className?: string }) {
  return (
    <div className={cn("mb-8", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}
