import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { BuyerSamples } from "@/components/sample-lists";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { acceptQuoteFn } from "@/lib/notifications.functions";
import { useI18n, fmt } from "@/lib/i18n";
import { useNames } from "@/lib/names";
import { useStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { QuoteChatToggle } from "@/components/quote-chat";
import { ReviewForm } from "@/components/reviews";

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
  const { t } = useI18n();
  const names = useNames();
  const st = useStatus();
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
    if (error) { toast.error(t("db.updFail")); return; }
    toast.success(next === "closed" ? t("db.closedOk") : t("db.reopenedOk"));
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  const isExpired = (r: { status: string; respond_by: string | null }) => r.status === "open" && !!r.respond_by && new Date(r.respond_by) <= new Date();

  async function extendRfq(rfqId: string, days: number) {
    const { error } = await supabase.rpc("extend_rfq", { _rfq: rfqId, _days: days });
    if (error) { toast.error(t("db.extFail"), { description: error.message }); return; }
    toast.success(fmt(t("db.extended"), { n: days }));
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  async function acceptQuote(quoteId: string, accepted: boolean) {
    try {
      const { email } = await acceptQuoteFn({ data: { quoteId, accepted } });
      toast.success(accepted ? t("db.accOk") : t("db.accUndo"), {
        description: !accepted ? undefined : email === "sent" ? t("db.emailSent") : email === "not_configured" ? t("db.emailNC") : email === "failed" ? t("db.emailFail") : undefined,
      });
    } catch (e) {
      toast.error(t("db.accFail"), { description: e instanceof Error ? e.message : undefined });
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  async function deleteRfq(rfqId: string) {
    if (!confirm(t("db.confirmDel"))) return;
    const { error } = await supabase.from("rfqs").delete().eq("id", rfqId);
    if (error) { toast.error(t("db.delFail")); return; }
    toast.success(t("db.deleted"));
    qc.invalidateQueries({ queryKey: ["my-rfqs"] });
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(t("db.copied"), { description: email });
    } catch {
      toast.error(t("db.copyFail"), { description: email });
    }
  }

  return (
    <>
      <PageHeader eyebrow={user.email ?? t("db.account")} title={t("db.title")}>
        {t("db.lead")}
      </PageHeader>
      <div className="container-page py-12">
        <div className="mb-6 flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/rfq">{t("db.newRfq")}</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/open-rfqs">{t("db.browseSup")}</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/become-a-supplier">{t("bl.apply")}</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/supplier/profile">{t("db.factoryProfile")}</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/favorites">{t("fv.link")}</Link></Button>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>{t("db.signOut")}</Button>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            [t("db.active"), data?.filter((r) => r.status === "open" && !isExpired(r)).length ?? 0],
            [t("db.received"), data?.reduce((n, r) => n + r.rfq_applications.length, 0) ?? 0],
            [t("db.sent"), quotes?.length ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="rfqs">
          <TabsList>
            <TabsTrigger value="rfqs">{t("db.tabRfqs")}</TabsTrigger>
            <TabsTrigger value="quotes">{t("db.tabQuotes")}</TabsTrigger>
            <TabsTrigger value="samples">{t("db.tabSamples")}</TabsTrigger>
          </TabsList>

          <TabsContent value="rfqs" className="mt-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("c.loading")}</p>
            ) : !data?.length ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                {t("db.none")}
              </div>
            ) : (
              <div className="grid gap-4">
                {data.map((r) => (
                  <div key={r.id} className="rounded-xl border">
                    <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{r.product}</p>
                        <p className="text-xs text-muted-foreground">{names.category(r.category)} · {r.country ? names.country(r.country) : t("rfq.anyCountry")} · {r.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-0.5">{fmt(t("db.apps"), { n: r.rfq_applications.length })}</span>
                        {isExpired(r) ? (
                          <span className="rounded-full border border-destructive/50 px-2 py-0.5 font-medium text-destructive">{t("db.expired")}</span>
                        ) : (
                          <span className="rounded-full border px-2 py-0.5 capitalize">{st(r.status)}</span>
                        )}
                        {r.respond_by && r.status === "open" && !isExpired(r) && <span>{fmt(t("db.answersBy"), { d: new Date(r.respond_by).toLocaleDateString() })}</span>}
                        {new Date(r.created_at).toLocaleDateString()}
                        {(r.status === "open" || r.status === "closed") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleStatus(r.id, r.status)}>
                            {r.status === "open" ? t("db.close") : t("db.reopen")}
                          </Button>
                        )}
                        {(r.status === "open" || r.status === "closed") && r.respond_by && (
                          <select aria-label={t("db.extendLabel")} className="h-7 rounded-md border bg-background px-1 text-xs" value="" onChange={(e) => e.target.value && extendRfq(r.id, Number(e.target.value))}>
                            <option value="">{isExpired(r) ? t("db.extendE") : t("db.extendBy")}</option><option value="7">{fmt(t("db.plusDays"), { n: 7 })}</option><option value="14">{fmt(t("db.plusDays"), { n: 14 })}</option><option value="30">{fmt(t("db.plusDays"), { n: 30 })}</option>
                          </select>
                        )}
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs"><Link to="/rfq-print/$id" params={{ id: r.id }}>{t("db.print")}</Link></Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteRfq(r.id)}>
                          {t("db.delete")}
                        </Button>
                      </div>
                    </div>
                    <RfqSteps quoteCount={r.rfq_applications.length} chosen={r.rfq_applications.some((a) => a.status === "accepted")} />
                    {r.rfq_applications.length === 0 ? (
                      <div className="border-t bg-muted/30 p-4 text-xs text-muted-foreground">
                        {t("db.live")}
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
                                {a.status === "accepted" && <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">{t("st.accepted")}</span>}
                                {best !== null && prices[i] === best && r.rfq_applications.length > 1 && (
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{t("db.bestPrice")}</span>
                                )}
                                {fast !== null && times[i] === fast && r.rfq_applications.length > 1 && (
                                  <span className="rounded-full border border-primary px-2 py-0.5 text-[10px] font-semibold text-primary">{t("db.fastest")}</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-md border p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">{t("db.unitPrice")}</p>
                                  <p className="font-semibold">{a.unit_price || t("fp.onRequest")}</p>
                                </div>
                                <div className="rounded-md border p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">{t("db.leadTime")}</p>
                                  <p className="font-semibold">{a.lead_time || t("db.notGiven")}</p>
                                </div>
                                <div className="rounded-md border p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">{t("db.minOrder")}</p>
                                  <p className="font-semibold">{a.min_order || t("db.notGiven")}</p>
                                </div>
                              </div>
                              <p className="whitespace-pre-line text-muted-foreground">{a.message}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {a.status === "accepted" ? (
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => acceptQuote(a.id, false)}>{t("db.undo")}</Button>
                                ) : (
                                  <Button size="sm" className="h-8" disabled={r.status === "closed"} onClick={() => acceptQuote(a.id, true)}>{t("db.accept")}</Button>
                                )}
                                <Button size="sm" variant="outline" className="h-8" asChild>
                                  <a href={`mailto:${a.supplier_email}?subject=${encodeURIComponent(`Re: RFQ — ${r.product}`)}`}><Mail className="mr-1 h-3 w-3" />{t("db.contact")}</a>
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => copyEmail(a.supplier_email)}><Copy className="mr-1 h-3 w-3" />{t("db.copyEmail")}</Button>
                                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                              </div>
                              <QuoteChatToggle applicationId={a.id} other={t("ch.factory")} />
                              {a.status === "accepted" && <ReviewForm applicationId={a.id} />}
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
              <p className="text-sm text-muted-foreground">{t("c.loading")}</p>
            ) : !quotes?.length ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                {t("db.noQuotes1")}{" "}
                <Link to="/open-rfqs" className="underline">{t("ft.browseRfqs")}</Link> {t("db.noQuotes2")}
              </div>
            ) : (
              <div className="grid gap-4">
                {quotes.map((q) => (
                  <div key={q.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{q.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {[q.category ? names.category(q.category) : null, q.country ? names.country(q.country) : null, q.quantity].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-0.5">{q.unit_price || t("db.priceOnReq")}</span>
                        <span className="rounded-full border px-2 py-0.5">{q.lead_time || t("db.leadNotGiven")}</span>
                        <span className="rounded-full border px-2 py-0.5 capitalize">{fmt(t("db.rfqStatus"), { s: st(q.rfq_status) })}</span>
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

/** Three-step progress of a request: posted, quotes received, quote chosen. */
function RfqSteps({ quoteCount, chosen }: { quoteCount: number; chosen: boolean }) {
  const { t } = useI18n();
  const steps = [
    { label: t("pg.posted"), done: true },
    { label: quoteCount > 0 ? `${t("pg.quotes")} (${quoteCount})` : t("pg.quotes"), done: quoteCount > 0 },
    { label: t("pg.chosen"), done: chosen },
  ];
  const current = steps.findIndex((x) => !x.done);
  return (
    <ol aria-label={t("pg.aria")} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pb-3 text-xs">
      {steps.map((x, i) => (
        <li key={i} className="flex items-center gap-2">
          <span
            className={cn(
              "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold",
              x.done ? "border-primary bg-primary text-primary-foreground" : i === current ? "border-primary text-primary" : "text-muted-foreground",
            )}
          >
            {x.done ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span className={x.done || i === current ? "font-medium text-foreground" : "text-muted-foreground"}>{x.label}</span>
          {i < steps.length - 1 && <span className={cn("h-px w-5 sm:w-10", steps[i + 1]?.done ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}
