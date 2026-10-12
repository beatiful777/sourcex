import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { BuyerSamples } from "@/components/sample-lists";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { acceptQuoteFn } from "@/lib/notifications.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My RFQs and Quotes — SOURCEX" },
      { name: "description", content: "Track your requests for quotation and the quotes you have sent as a supplier." },
      { property: "og:title", content: "My RFQs and Quotes — SOURCEX" },
      { property: "og:description", content: "Your requests, supplier offers and submitted quotes in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type Quote = {
  id: string;
  rfq_id: string;
  product: string;
  category: string | null;
  country: string | null;
  quantity: string | null;
  rfq_status: string | null;
  unit_price: string | null;
  lead_time: string | null;
  message: string;
  applied_at: string;
};

function num(s: string | null) {
  const m = s?.match(/\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : null;
}
function minOf(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? Math.min(...v) : null;
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-rfqs", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfqs")
        .select("*, rfq_applications(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["my-quotes", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_quotes");
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  }

  async function toggleStatus(rfqId: string, status: string) {
    const next = status === "open" ? "closed" : "open";
    const { error } = await supabase.from("rfqs").update({ status: next }).eq("id", rfqId);
    if (error) { toast.error("Couldn't update RFQ"); return; }
    toast.success(next === "closed" ? "RFQ closed" : "RFQ re-opened");
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  const isExpired = (r: { status: string; respond_by: string | null }) => r.status === "open" && !!r.respond_by && new Date(r.respond_by) <= new Date();

  async function extendRfq(rfqId: string, days: number) {
    const { error } = await supabase.rpc("extend_rfq", { _rfq: rfqId, _days: days });
    if (error) { toast.error("Couldn't extend", { description: error.message }); return; }
    toast.success(`Extended by ${days} days`);
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  async function acceptQuote(quoteId: string, accepted: boolean) {
    try {
      const { email } = await acceptQuoteFn({ data: { quoteId, accepted } });
      toast.success(accepted ? "Quote accepted" : "Selection removed", {
        description: !accepted ? undefined : email === "sent" ? "We emailed you and the factory." : email === "not_configured" ? "Email notifications are not configured yet." : email === "failed" ? "Saved, but the notification email could not be sent." : undefined,
      });
    } catch (e) {
      toast.error("Couldn't update the quote", { description: e instanceof Error ? e.message : undefined });
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  async function deleteRfq(rfqId: string) {
    if (!confirm("Delete this RFQ and all its applications?")) return;
    const { error } = await supabase.from("rfqs").delete().eq("id", rfqId);
    if (error) { toast.error("Couldn't delete RFQ"); return; }
    toast.success("RFQ deleted");
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied", { description: email });
    } catch {
      toast.error("Couldn't copy", { description: email });
    }
  }

  return (
    <>
      <PageHeader eyebrow={user.email ?? "Account"} title="Dashboard">
        Requests you've posted, offers you've received and quotes you've sent.
      </PageHeader>
      <div className="container-page py-12">
        <div className="mb-6 flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/rfq">New RFQ</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/open-rfqs">Browse open RFQs (suppliers)</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/become-a-supplier">Apply as a supplier</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/supplier/profile">Factory profile</Link></Button>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Active RFQs", data?.filter((r) => r.status === "open" && !isExpired(r)).length ?? 0],
            ["Quotes received", data?.reduce((n, r) => n + r.rfq_applications.length, 0) ?? 0],
            ["Quotes I sent", quotes?.length ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="rfqs">
          <TabsList>
            <TabsTrigger value="rfqs">My RFQs (Buyer)</TabsTrigger>
            <TabsTrigger value="quotes">My Submitted Quotes (Supplier)</TabsTrigger>
            <TabsTrigger value="samples">Samples</TabsTrigger>
          </TabsList>

          <TabsContent value="rfqs" className="mt-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !data?.length ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No RFQs yet. Post your first one to get started.
              </div>
            ) : (
              <div className="grid gap-4">
                {data.map((r) => (
                  <div key={r.id} className="rounded-xl border">
                    <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{r.product}</p>
                        <p className="text-xs text-muted-foreground">{r.category} · {r.country || "Any country"} · {r.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-0.5">{r.rfq_applications.length} application{r.rfq_applications.length === 1 ? "" : "s"}</span>
                        {isExpired(r) ? (
                          <span className="rounded-full border border-destructive/50 px-2 py-0.5 font-medium text-destructive">Expired</span>
                        ) : (
                          <span className="rounded-full border px-2 py-0.5 capitalize">{r.status === "in_progress" ? "In progress" : r.status}</span>
                        )}
                        {r.respond_by && r.status === "open" && !isExpired(r) && <span>answers by {new Date(r.respond_by).toLocaleDateString()}</span>}
                        {new Date(r.created_at).toLocaleDateString()}
                        {(r.status === "open" || r.status === "closed") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleStatus(r.id, r.status)}>
                            {r.status === "open" ? "Close RFQ" : "Re-open"}
                          </Button>
                        )}
                        {(r.status === "open" || r.status === "closed") && r.respond_by && (
                          <select aria-label="Extend deadline" className="h-7 rounded-md border bg-background px-1 text-xs" value="" onChange={(e) => e.target.value && extendRfq(r.id, Number(e.target.value))}>
                            <option value="">{isExpired(r) ? "Extend…" : "Extend by…"}</option><option value="7">+7 days</option><option value="14">+14 days</option><option value="30">+30 days</option>
                          </select>
                        )}
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs"><Link to="/rfq-print/$id" params={{ id: r.id }}>Print RFQ</Link></Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteRfq(r.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    {r.rfq_applications.length === 0 ? (
                      <div className="border-t bg-muted/30 p-4 text-xs text-muted-foreground">
                        Your request is live for verified factories. Quotes will appear here.
                      </div>
                    ) : (() => {
                      const prices = r.rfq_applications.map((a) => num(a.unit_price));
                      const times = r.rfq_applications.map((a) => num(a.lead_time));
                      const best = minOf(prices);
                      const fast = minOf(times);
                      return (
                        <div className="grid gap-3 border-t bg-muted/30 p-4 sm:grid-cols-2">
                          {r.rfq_applications.map((a, i) => (
                            <div key={a.id} className="grid gap-2 rounded-lg border bg-background p-4 text-sm">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{a.company_name}</p>
                                {a.status === "accepted" && <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">Accepted</span>}
                                {best !== null && prices[i] === best && r.rfq_applications.length > 1 && (
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Best price</span>
                                )}
                                {fast !== null && times[i] === fast && r.rfq_applications.length > 1 && (
                                  <span className="rounded-full border border-primary px-2 py-0.5 text-[10px] font-semibold text-primary">Fastest</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-md border p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">Unit price</p>
                                  <p className="font-semibold">{a.unit_price || "On request"}</p>
                                </div>
                                <div className="rounded-md border p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">Lead time</p>
                                  <p className="font-semibold">{a.lead_time || "Not given"}</p>
                                </div>
                                <div className="rounded-md border p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">Min. order</p>
                                  <p className="font-semibold">{a.min_order || "Not given"}</p>
                                </div>
                              </div>
                              <p className="whitespace-pre-line text-muted-foreground">{a.message}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {a.status === "accepted" ? (
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => acceptQuote(a.id, false)}>Undo accept</Button>
                                ) : (
                                  <Button size="sm" className="h-8" disabled={r.status === "closed"} onClick={() => acceptQuote(a.id, true)}>Accept quote</Button>
                                )}
                                <Button size="sm" variant="outline" className="h-8" asChild>
                                  <a href={`mailto:${a.supplier_email}?subject=${encodeURIComponent(`Re: RFQ — ${r.product}`)}`}><Mail className="mr-1 h-3 w-3" />Contact factory</a>
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => copyEmail(a.supplier_email)}><Copy className="mr-1 h-3 w-3" />Copy email</Button>
                                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            {quotesLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !quotes?.length ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                You haven't sent a quote yet.{" "}
                <Link to="/open-rfqs" className="underline">Browse open RFQs</Link> and submit your price and lead time.
              </div>
            ) : (
              <div className="grid gap-4">
                {quotes.map((q) => (
                  <div key={q.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{q.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {[q.category, q.country, q.quantity].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-0.5">{q.unit_price || "Price on request"}</span>
                        <span className="rounded-full border px-2 py-0.5">{q.lead_time || "Lead time not given"}</span>
                        <span className="rounded-full border px-2 py-0.5 capitalize">RFQ {q.rfq_status}</span>
                        {new Date(q.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                    {q.message && <p className="mt-3 whitespace-pre-line text-sm">{q.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="samples" className="mt-6">
            <BuyerSamples />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
