import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FileText, MessagesSquare, PackageCheck, X, ShieldCheck, BadgeCheck, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, filterCountries, categoryName } from "@/lib/catalog";
import { CountryCard, SuppliersEmpty } from "@/components/blocks";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            {t("home.h1a")}
            <span className="block text-muted-foreground">{t("home.h1b")}</span>
          </h1>
          <form onSubmit={submit} className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-xl border bg-background p-1.5">
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.searchPh")}
              aria-label={t("home.search")}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" aria-label="Clear" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <Button type="submit" className="h-10 px-5">{t("home.search")}</Button>
          </form>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Link to="/rfq" className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary">
              <p className="text-sm font-semibold">{t("home.buyer")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("home.buyerDesc")}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">{t("home.buyerCta")}</span>
            </Link>
            <Link to="/become-a-supplier" className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary">
              <p className="text-sm font-semibold">{t("home.factory")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("home.factoryDesc")}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">{t("home.factoryCta")}</span>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {t("home.popular")}
            {([["Textiles", "pop.textiles"], ["Vietnam", "pop.vietnam"], ["Electronics", "pop.electronics"], ["Europe", "pop.europe"]] as const).map(([q, k]) => (
              <button key={q} onClick={() => setQuery(q)} className="underline-offset-4 hover:text-foreground hover:underline">{t(k)}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: t("trust.1t"), d: t("trust.1d") },
            { icon: BadgeCheck, t: t("trust.2t"), d: t("trust.2d") },
            { icon: Scale, t: t("trust.3t"), d: t("trust.3d") },
          ].map((b) => (
            <div key={b.t} className="flex gap-3">
              <b.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
              <div>
                <h3 className="text-sm font-semibold">{b.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-20">
        <SectionHead eyebrow={t("home.catEyebrow")} title={t("home.catTitle")} />
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
            <SectionHead eyebrow={t("home.hubsEyebrow")} title={t("home.hubsTitle")} className="mb-0" />
            {filtering && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {hubs.length} {t("home.hubsWord")}
                  {category && <> · {categoryName(category)}</>}
                  {query && <> · “{query}”</>}
                </span>
                <button onClick={() => { setQuery(""); setCategory(null); }} className="font-medium text-primary">{t("home.clear")}</button>
              </div>
            )}
          </div>
          {hubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {hubs.map((c) => <CountryCard key={c.slug} c={c} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-background py-12 text-center text-sm text-muted-foreground">
              {t("home.noHubs")}{" "}
              <button onClick={() => { setQuery(""); setCategory(null); }} className="font-medium text-primary">{t("home.reset")}</button>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-20">
        <SectionHead eyebrow={t("home.procEyebrow")} title={t("home.procTitle")} />
        <div className="grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
          {[
            { icon: FileText, t: t("home.step1t"), d: t("home.step1d") },
            { icon: MessagesSquare, t: t("home.step2t"), d: t("home.step2d") },
            { icon: PackageCheck, t: t("home.step3t"), d: t("home.step3d") },
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
          <Button asChild><Link to="/rfq">{t("home.postRfq")}</Link></Button>
          <Button variant="outline" onClick={() => navigate({ to: "/how-it-works" })}>{t("home.learnMore")}</Button>
        </div>
      </section>

      {/* Featured suppliers */}
      <section className="container-page pb-24">
        <SectionHead eyebrow={t("home.featEyebrow")} title={t("home.featTitle")} />
        <SuppliersEmpty note={t("home.featNote")} />
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
