import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InquiryDialog } from "@/components/inquiry-dialog";
import { SampleRequestButton } from "@/components/sample-request-button";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/factory/$id")({
  head: () => ({
    meta: [
      { title: "Factory profile — SOURCEX" },
      { name: "description", content: "Profile of a factory approved by hand on SOURCEX." },
      { property: "og:title", content: "Factory profile — SOURCEX" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FactoryPage,
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
  factory_details: string | null;
  logo_url: string | null;
};

function safeUrl(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim();
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function FactoryPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["factory", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_applications")
        .select("id, company_name, country, city, categories, min_order_quantity, certifications, website_or_catalog, factory_details, logo_url")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data as Factory | null;
    },
  });

  if (isLoading) return <div className="container-page py-16 text-sm text-muted-foreground">Loading…</div>;

  if (error || !data)
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold">Factory not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may not be approved yet, or the link is wrong.</p>
        <Link to="/suppliers" className="mt-6 text-sm font-medium text-primary">← Back to suppliers</Link>
      </div>
    );

  const site = safeUrl(data.website_or_catalog);
  const logo = data.logo_url && data.logo_url.startsWith("https://") ? data.logo_url : null;
  const place = [data.city, data.country].filter(Boolean).join(", ");

  return (
    <div className="container-page max-w-3xl py-12">
      <Link to="/suppliers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All suppliers
      </Link>

      <div className="mt-6 flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted text-xs text-muted-foreground">
          {logo ? <img src={logo} alt={`${data.company_name} logo`} className="h-full w-full object-contain" /> : "No logo"}
        </div>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold tracking-tight">{data.company_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-xs text-accent-foreground">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
            {place && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {place}</span>
            )}
          </div>
        </div>
      </div>

      {data.factory_details && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">About</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{data.factory_details}</p>
        </section>
      )}

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        {data.categories.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>
            <div className="flex flex-wrap gap-1.5">
              {data.categories.map((c) => <span key={c} className="rounded-md border px-2 py-0.5 text-xs">{c}</span>)}
            </div>
          </div>
        )}
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Minimum order</h2>
          <p className="text-sm">{data.min_order_quantity || "On request"}</p>
        </div>
        {data.certifications.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Certifications</h2>
            <p className="text-sm">{data.certifications.join(", ")}</p>
          </div>
        )}
        {site && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Website / catalog</h2>
            <a href={site} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all text-sm text-primary">
              {data.website_or_catalog} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
        <Button asChild><Link to="/rfq">Post an RFQ</Link></Button>
        <InquiryDialog target={data.company_name} trigger={<Button variant="outline">Send inquiry</Button>} />
        <SampleRequestButton supplierId={data.id} company={data.company_name} />
      </div>
    </div>
  );
}
