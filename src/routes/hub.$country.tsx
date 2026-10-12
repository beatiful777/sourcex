import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { COUNTRIES, flagUrl, categoryName } from "@/lib/catalog";
import { CountryCard, SuppliersEmpty } from "@/components/blocks";
import { SampleRequestButton } from "@/components/sample-request-button";
import { InquiryDialog } from "@/components/inquiry-dialog";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hub/$country")({
  loader: ({ params }) => {
    const country = COUNTRIES.find((c) => c.slug === params.country);
    if (!country) throw notFound();
    return { country };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Hub not found — SOURCEX" }, { name: "robots", content: "noindex" }] };
    const n = loaderData.country.name;
    return {
      meta: [
        { title: `${n} Sourcing Hub — SOURCEX` },
        { name: "description", content: `Source ${loaderData.country.strengths.map((s) => categoryName(s).toLowerCase()).join(", ")} from ${n}. Verified factories, comparable quotes, zero fake profiles.` },
        { property: "og:title", content: `${n} Sourcing Hub — SOURCEX` },
        { property: "og:description", content: `Explore verified ${n} manufacturing on SOURCEX.` },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/hub/${loaderData.country.slug}` },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `/hub/${loaderData.country.slug}` }],
    };
  },
  component: Hub,
});

type ApprovedSupplier = {
  id: string;
  company_name: string;
  city: string | null;
  categories: string[] | null;
  min_order_quantity: string | null;
  certifications: string[] | null;
};

function Hub() {
  const { country } = Route.useLoaderData();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["hub-suppliers", country.code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_applications")
        .select("id, company_name, city, categories, min_order_quantity, certifications")
        .eq("status", "approved")
        .eq("country", country.name)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApprovedSupplier[];
    },
  });

  const related = COUNTRIES.filter((c) => c.region === country.region && c.slug !== country.slug).slice(0, 4);

  return (
    <>
      <section className="border-b bg-subtle">
        <div className="container-page py-12">
          <Link to="/hubs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All hubs
          </Link>
          <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex items-center gap-4">
              <img src={flagUrl(country.code)} alt={`${country.name} flag`} className="h-10 w-15 rounded border object-cover" />
              <div>
                <p className="eyebrow">{country.region} · Sourcing hub</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{country.name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <InquiryDialog target={`${country.name} hub`} />
              <Button asChild variant="outline"><Link to="/rfq">Post RFQ</Link></Button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {country.strengths.map((s) => (
              <span key={s} className="rounded-full border bg-background px-3 py-1 text-xs">{categoryName(s)}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="container-page py-14">
        <h2 className="mb-6 text-lg font-semibold">Suppliers in {country.name}</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !suppliers?.length ? (
          <>
            <SuppliersEmpty note={`No verified suppliers in ${country.name} yet. Send an inquiry and we'll match you as suppliers are onboarded.`} />
            <WaitlistForm countryCode={country.code} countryName={country.name} />
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-5">
                <p className="font-medium">{s.company_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{[s.city, country.name].filter(Boolean).join(", ")}</p>
                {s.categories?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.categories.map((c) => (
                      <span key={c} className="rounded-full border bg-background px-2 py-0.5 text-xs">{c}</span>
                    ))}
                  </div>
                ) : null}
                {s.min_order_quantity && (
                  <p className="mt-3 text-xs text-muted-foreground">MOQ: {s.min_order_quantity}</p>
                )}
                <div className="mt-4"><SampleRequestButton supplierId={s.id} company={s.company_name} /></div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="container-page pb-16">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Nearby hubs in {country.region}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((c) => <CountryCard key={c.slug} c={c} />)}
        </div>
      </section>
    </>
  );
}
