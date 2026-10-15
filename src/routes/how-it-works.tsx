import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — SOURCEX" },
      { name: "description", content: "Post an RFQ, receive comparable quotes from verified factories, and source smart — how SOURCEX works for buyers and suppliers." },
      { property: "og:title", content: "How It Works — SOURCEX" },
      { property: "og:description", content: "Three steps to source from verified suppliers worldwide." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/how-it-works" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: How,
});

function How() {
  const { t } = useI18n();
  const steps = [
    { t: t("ft.postRfq"), d: t("how.s1d"), detail: t("how.s1x") },
    { t: t("how.s2t"), d: t("how.s2d"), detail: t("how.s2x") },
    { t: t("how.s3t"), d: t("how.s3d"), detail: t("how.s3x") },
  ];
  const sides = [
    { t: t("ft.buyers"), items: [t("how.b1"), t("how.b2"), t("how.b3"), t("how.b4")] },
    { t: t("ft.suppliers"), items: [t("how.f1"), t("how.f2"), t("how.f3"), t("how.f4")] },
  ];
  return (
    <>
      <PageHeader eyebrow={t("how.eyebrow")} title={t("how.title")}>
        {t("how.lead")}
      </PageHeader>
      <div className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col rounded-xl border bg-card p-8">
              <span className="font-mono text-3xl font-semibold text-primary">0{i + 1}</span>
              <h2 className="mt-6 text-xl font-semibold">{s.t}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.d}</p>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sides.map((s, i) => (
            <div key={i} className="rounded-xl border bg-card p-8">
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <ul className="mt-4 space-y-2">
                {s.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-subtle p-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{t("how.noteLead")}</span> {t("how.note")}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg"><Link to="/rfq">{t("ft.postRfq")}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/become-a-supplier">{t("ft.become")}</Link></Button>
        </div>
      </div>
    </>
  );
}
