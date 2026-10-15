import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Globe2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

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

function LiveNumbers() {
  const { t } = useI18n();
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
    ? ([
        [t("about.stat.factories"), s.suppliers],
        [t("about.stat.countries"), s.countries],
        [t("about.stat.rfqs"), s.open_rfqs],
        [t("about.stat.quotes"), s.quotes],
      ] as const)
    : [];
  return (
    <section aria-labelledby="live-numbers" className="mt-10">
      <h2 id="live-numbers" className="font-semibold">{t("about.liveTitle")}</h2>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">{t("about.liveErr")}</p>
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
  const { t } = useI18n();
  const pillars = [
    { icon: ShieldCheck, t: t("about.pill1t"), d: t("about.pill1d") },
    { icon: Globe2, t: t("about.pill2t"), d: t("about.pill2d") },
    { icon: FileText, t: t("about.pill3t"), d: t("about.pill3d") },
  ];
  return (
    <>
      <PageHeader eyebrow={t("about.eyebrow")} title={t("about.title")}>
        {t("about.lead")}
      </PageHeader>
      <div className="container-page max-w-3xl py-14">
        <div className="space-y-5 text-muted-foreground">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.t} className="rounded-xl border bg-card p-6">
              <p.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
              <h2 className="mt-4 font-semibold">{p.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>

        <LiveNumbers />

        <div className="mt-10 rounded-xl border bg-subtle p-6">
          <h2 className="font-semibold">{t("about.contactTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("about.contactPre")}{" "}
            <Link className="text-foreground underline underline-offset-4" to="/contact">{t("about.contactLink")}</Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/rfq">{t("ft.postRfq")}</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/become-a-supplier">{t("ft.become")}</Link></Button>
          </div>
        </div>
      </div>
    </>
  );
}
