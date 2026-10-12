import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";

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

const STEPS = [
  {
    t: "Post an RFQ",
    d: "Describe your product in one structured request: specs, materials, quantity, target price, packaging and timeline. Pick a sourcing hub — or leave it open and let every relevant hub see it.",
    detail: "Takes about 3 minutes. No account needed to post.",
  },
  {
    t: "Get quotes",
    d: "Verified suppliers in matching hubs and categories respond with a unit price, a lead time and a short note — always in the same format, so offers are easy to compare side by side.",
    detail: "Quotes land in your dashboard, with the best price and fastest lead time marked.",
  },
  {
    t: "Source smart",
    d: "Compare factories across countries on cost, lead time and certifications, then contact the one that fits. No platform fee, no middleman — you deal with the factory directly.",
    detail: "You keep every quote in your dashboard and decide in your own time.",
  },
];

const SIDES = [
  {
    t: "For buyers",
    items: [
      "One RFQ reaches multiple countries at once",
      "Verified factories only — no resellers, no fake profiles",
      "Quotes in a comparable format, best price highlighted",
      "Free: no posting fee, no commission",
    ],
  },
  {
    t: "For suppliers",
    items: [
      "Get matched RFQs in your category and region",
      "No ads, no pay-to-win ranking",
      "A verified badge after a human review",
      "Apply once, reach buyers worldwide",
    ],
  },
];

function How() {
  return (
    <>
      <PageHeader eyebrow="Process" title="How SOURCEX Works">
        Three steps between your product idea and a factory that can actually make it.
      </PageHeader>
      <div className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.t} className="flex flex-col rounded-xl border bg-card p-8">
              <span className="font-mono text-3xl font-semibold text-primary">0{i + 1}</span>
              <h2 className="mt-6 text-xl font-semibold">{s.t}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.d}</p>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {SIDES.map((s) => (
            <div key={s.t} className="rounded-xl border bg-card p-8">
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <ul className="mt-4 space-y-2">
                {s.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-subtle p-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Honest beta note:</span> the directory only shows factories
          that applied and passed review. If a hub looks empty, it is — and the first verified factory there could be yours.
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg"><Link to="/rfq">Post an RFQ</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/become-a-supplier">Become a supplier</Link></Button>
        </div>
      </div>
    </>
  );
}
