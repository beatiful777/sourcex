import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/open-rfqs")({
  head: () => ({
    meta: [
      { title: "Open RFQs for Suppliers — SOURCEX" },
      { name: "description", content: "Browse open buyer requests and apply with your offer." },
      { property: "og:title", content: "Open RFQs for Suppliers — SOURCEX" },
      { property: "og:description", content: "Find buyers and send your quote in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OpenRfqs,
});

function OpenRfqs() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["open-rfqs", user.id],
    queryFn: async () => {
      const [rfqs, mine] = await Promise.all([
        supabase.rpc("list_open_rfqs"),
        supabase.from("rfq_applications").select("rfq_id").eq("supplier_id", user.id),
      ]);
      if (rfqs.error) throw rfqs.error;
      const applied = new Set((mine.data ?? []).map((a) => a.rfq_id));
      return (rfqs.data ?? []).map((r) => ({ ...r, applied: applied.has(r.id) }));
    },
  });

  return (
    <>
      <PageHeader eyebrow="For suppliers" title="Open RFQs">
        Buyers are looking for these products. Verified factories send their quote in the RFQ Desk.
      </PageHeader>
      <div className="container-page py-12">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.length ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No open RFQs right now. Check back soon.</div>
        ) : (
          <div className="grid gap-4">
            {data.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{r.product}</p>
                    <p className="text-xs text-muted-foreground">{r.category} · {r.country || "Any country"} · {r.quantity} · {new Date(r.created_at).toLocaleDateString()}</p>
                    {r.details && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.details}</p>}
                  </div>
                  {r.is_mine ? (
                    <span className="text-xs text-muted-foreground">Your RFQ</span>
                  ) : r.applied ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs">Quoted</span>
                  ) : (
                    <Button asChild size="sm" variant="outline"><Link to="/supplier/rfqs">Quote in RFQ Desk</Link></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
