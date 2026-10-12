import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileText, ShieldCheck, Store } from "lucide-react";
import { flagUrl, type Country } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export function CountryCard({ c }: { c: Country }) {
  return (
    <Link
      to="/hub/$country"
      params={{ country: c.slug }}
      className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <img src={flagUrl(c.code)} alt="" loading="lazy" className="h-6 w-9 rounded-sm border object-cover" />
        <div>
          <div className="text-sm font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground">Explore</div>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}

export function SuppliersEmpty({ note }: { note?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-subtle px-6 py-14 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border bg-background">
        <ShieldCheck className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 font-semibold">Verified suppliers coming soon</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {note ?? "Platform in private beta. We only list suppliers after verification — no placeholder listings."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/rfq">Post an RFQ instead</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/become-a-supplier">Apply as a supplier</Link>
        </Button>
      </div>
    </div>
  );
}

export function FoundingNetwork() {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-subtle p-6 md:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="eyebrow">Founding supplier program</p>
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">
          We curate directly with factories. Zero fake profiles.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Every listing in this directory is a manufacturer that applied, was reviewed by hand and approved by us.
          No placeholder companies, no invented production numbers. Right now the directory is empty — which means
          you can be the first factory in it.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border p-6">
          <div className="grid h-10 w-10 place-items-center rounded-full border bg-subtle">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-4 font-semibold">Apply as a Founding Supplier</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            A verified badge on your listing, zero platform fees for the first six months and priority matching on
            new requests. Review takes 24-48 hours.
          </p>
          <Button asChild className="mt-5 justify-self-start">
            <Link to="/become-a-supplier">Start application</Link>
          </Button>
        </div>
        <div className="flex flex-col rounded-xl border p-6">
          <div className="grid h-10 w-10 place-items-center rounded-full border bg-subtle">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-4 font-semibold">Need sourcing right now?</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Post a request for quotation. One brief reaches manufacturers across every relevant hub and you compare
            quotes side by side.
          </p>
          <Button asChild variant="outline" className="mt-5 justify-self-start">
            <Link to="/rfq">Post an RFQ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="border-b bg-subtle">
      <div className="container-page py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-muted-foreground">{children}</div>}
      </div>
    </section>
  );
}
