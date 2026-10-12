import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/rfq-print/$id")({
  head: () => ({ meta: [{ title: "Print RFQ — SOURCEX" }, { name: "robots", content: "noindex" }] }),
  component: PrintRfq,
});

// Only the owner can read the row (RLS: user_id = auth.uid()), so a stranger's id returns nothing.
function PrintRfq() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["rfq-print", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rfqs").select("*, rfq_applications(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <div className="container-page py-12 text-sm text-muted-foreground">Loading…</div>;
  if (!data)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-xl font-semibold">RFQ not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It doesn't exist or it isn't yours.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  const row = (k: string, v: string | null | undefined) => (
    <div className="grid grid-cols-[10rem_1fr] gap-3 border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="whitespace-pre-line">{v || "—"}</dd></div>
  );
  return (
    <article className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard">← Back</Link></Button>
        <Button size="sm" onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>
      <header className="mb-6 border-b pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">SOURCEX · Request for quotation</p>
        <h1 className="mt-1 text-2xl font-semibold">{data.product}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Reference {data.id} · posted {new Date(data.created_at).toLocaleDateString()} · status {data.status === "in_progress" ? "in progress" : data.status}</p>
      </header>
      <dl>
        {row("Category", data.category)}
        {row("Preferred hub", data.country || "Any country")}
        {row("Quantity", data.quantity)}
        {row("Buyer email", data.email)}
        {row("Answers needed by", data.respond_by ? new Date(data.respond_by).toLocaleDateString() : "No deadline")}
        {row("Details", data.details)}
      </dl>
      <h2 className="mb-2 mt-8 text-base font-semibold">Quotes received ({data.rfq_applications.length})</h2>
      {data.rfq_applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes yet.</p>
      ) : (
        <div className="grid gap-3">
          {data.rfq_applications.map((a) => (
            <section key={a.id} className="break-inside-avoid rounded-lg border p-3 text-sm">
              <p className="font-medium">{a.company_name}{a.status === "accepted" ? " — accepted" : ""}</p>
              <p className="text-xs text-muted-foreground">Price {a.unit_price || "—"} · Lead time {a.lead_time || "—"} · MOQ {a.min_order || "—"}</p>
              {a.message && <p className="mt-2 whitespace-pre-line">{a.message}</p>}
            </section>
          ))}
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground print:mt-4">Printed {new Date().toLocaleDateString()}. Prices in quotes are as entered by each factory.</p>
    </article>
  );
}
