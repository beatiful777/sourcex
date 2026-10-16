import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FactorySamples } from "@/components/sample-lists";
import { submitQuoteFn } from "@/lib/notifications.functions";
import { RfqFiles } from "@/components/rfq-files";
import { QuoteChatToggle } from "@/components/quote-chat";
import { useI18n, fmt } from "@/lib/i18n";
import { useNames } from "@/lib/names";
import { useStatus } from "@/lib/status";

export const Route = createFileRoute("/_authenticated/supplier/rfqs")({
  head: () => ({
    meta: [
      { title: "RFQ Desk for Verified Factories — SOURCEX" },
      { name: "description", content: "Open buyer requests in your categories. Send and edit your quote." },
      { property: "og:title", content: "RFQ Desk — SOURCEX" },
      { property: "og:description", content: "Verified factories quote on open RFQs in their categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desk,
});

type Row = {
  id: string; product: string; category: string; country: string | null; quantity: string;
  details: string | null; created_at: string; quote_id: string | null; unit_price: string | null;
  lead_time: string | null; min_order: string | null; message: string | null; quote_status: string | null;
};

function Desk() {
  const { t } = useI18n();
  const names = useNames();
  const st = useStatus();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const supplier = useQuery({
    queryKey: ["my-approved-supplier"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_approved_supplier");
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const rfqs = useQuery({
    queryKey: ["supplier-desk"],
    enabled: !!supplier.data,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("supplier_desk_rfqs");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  if (supplier.isLoading) return <div className="container-page py-12 text-sm text-muted-foreground">{t("c.loading")}</div>;
  if (!supplier.data)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("dk.deny")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("dk.denyD")}</p>
        <Button asChild className="mt-6"><Link to="/become-a-supplier">{t("bl.apply")}</Link></Button>
      </div>
    );

  return (
    <>
      <PageHeader eyebrow={supplier.data.company_name} title={t("dk.title")}>
        {fmt(t("dk.lead"), { cats: supplier.data.categories.map((c) => names.category(c)).join(", ") || "—" })}{" "}
        <Link to="/supplier/profile" className="underline">{t("dk.editProfile")}</Link>
      </PageHeader>
      <div className="container-page py-12">
        {rfqs.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("c.loading")}</p>
        ) : !rfqs.data?.length ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("dk.none")}</div>
        ) : (
          <div className="grid gap-4">
            {rfqs.data.map((r) => {
              const accepted = r.quote_status === "accepted";
              return (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{r.product}</p>
                      <p className="text-xs text-muted-foreground">{names.category(r.category)} · {r.country ? names.country(r.country) : t("rfq.anyCountry")} · {r.quantity} · {new Date(r.created_at).toLocaleDateString()}</p>
                      {r.details && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.details}</p>}
                      <RfqFiles rfqId={r.id} />
                      {r.quote_id && (
                        <p className="mt-2 text-xs">{t("dk.yourQuote")} {r.unit_price || "—"} · {r.lead_time || "—"} · {t("dk.moq")} {r.min_order || "—"} · <b>{st(r.quote_status)}</b></p>
                      )}
                      {r.quote_id && <div className="mt-3"><QuoteChatToggle applicationId={r.quote_id} other={t("ch.buyer")} /></div>}
                    </div>
                    {!accepted && (
                      <Button size="sm" variant={openId === r.id ? "outline" : "default"} onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                        {openId === r.id ? t("dk.cancel") : r.quote_id ? t("dk.edit") : t("dk.send")}
                      </Button>
                    )}
                  </div>
                  {openId === r.id && (
                    <QuoteForm row={r} onDone={() => { setOpenId(null); qc.invalidateQueries({ queryKey: ["supplier-desk"] }); }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
        <FactorySamples />
      </div>
    </>
  );
}

function QuoteForm({ row, onDone }: { row: Row; onDone: () => void }) {
  const { t } = useI18n();
  const [price, setPrice] = useState(row.unit_price ?? "");
  const [leadN, setLeadN] = useState(row.lead_time?.match(/\d+/)?.[0] ?? "");
  const [unit, setUnit] = useState(row.lead_time?.includes("week") ? "weeks" : "days");
  const [moq, setMoq] = useState(row.min_order ?? "");
  const [msg, setMsg] = useState(row.message ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!price.trim() || !leadN.trim() || msg.trim().length < 1) { toast.error(t("dk.fill")); return; }
    setBusy(true);
    let email = "skipped";
    try {
      ({ email } = await submitQuoteFn({
        data: { rfqId: row.id, unitPrice: price.trim(), leadTime: `${leadN.trim()} ${Number(leadN) === 1 ? unit.slice(0, -1) : unit}`, minOrder: moq.trim(), message: msg.trim() },
      }));
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : t("dk.saveFail"));
      return;
    }
    setBusy(false);
    toast.success(row.quote_id ? t("dk.updated") : t("dk.sentOk"), { description: email === "sent" ? t("dk.buyerNotified") : undefined });
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
      <div><Label>{t("calc.unit")}</Label><Input value={price} maxLength={40} onChange={(e) => setPrice(e.target.value)} placeholder="$4.20" /></div>
      <div>
        <Label>{t("db.leadTime")}</Label>
        <div className="flex gap-2">
          <Input type="number" min={1} value={leadN} onChange={(e) => setLeadN(e.target.value)} />
          <select className="rounded-md border bg-background px-2 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="days">{t("dk.days")}</option><option value="weeks">{t("dk.weeks")}</option>
          </select>
        </div>
      </div>
      <div><Label>{t("fp.minOrder")}</Label><Input value={moq} maxLength={40} onChange={(e) => setMoq(e.target.value)} placeholder="500 pcs" /></div>
      <div className="sm:col-span-2"><Label>{t("dk.message")}</Label><Textarea value={msg} maxLength={2000} onChange={(e) => setMsg(e.target.value)} rows={4} /></div>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? t("dk.saving") : row.quote_id ? t("dk.update") : t("dk.send")}</Button></div>
    </form>
  );
}
