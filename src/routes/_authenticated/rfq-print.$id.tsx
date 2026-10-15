import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n, fmt } from "@/lib/i18n";
import { useNames } from "@/lib/names";
import { useStatus } from "@/lib/status";

export const Route = createFileRoute("/_authenticated/rfq-print/$id")({
  head: () => ({ meta: [{ title: "Print RFQ — SOURCEX" }, { name: "robots", content: "noindex" }] }),
  component: PrintRfq,
});

// Only the owner can read the row (RLS: user_id = auth.uid()), so a stranger's id returns nothing.
function PrintRfq() {
  const { t } = useI18n();
  const names = useNames();
  const st = useStatus();
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["rfq-print", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rfqs").select("*, rfq_applications(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <div className="container-page py-12 text-sm text-muted-foreground">{t("c.loading")}</div>;
  if (!data)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-xl font-semibold">{t("pr.notFound")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("pr.notFoundD")}</p>
        <Button asChild className="mt-6"><Link to="/dashboard">{t("pr.backDash")}</Link></Button>
      </div>
    );
  const row = (k: string, v: string | null | undefined) => (
    <div className="grid grid-cols-[10rem_1fr] gap-3 border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="whitespace-pre-line">{v || "—"}</dd></div>
  );
  return (
    <article className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard">{t("pr.back")}</Link></Button>
        <Button size="sm" onClick={() => window.print()}>{t("pr.print")}</Button>
      </div>
      <header className="mb-6 border-b pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">SOURCEX · {t("rfq.eyebrow")}</p>
        <h1 className="mt-1 text-2xl font-semibold">{data.product}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{fmt(t("pr.ref"), { id: data.id, d: new Date(data.created_at).toLocaleDateString(), s: st(data.status) })}</p>
      </header>
      <dl>
        {row(t("rfq.category"), data.category ? names.category(data.category) : null)}
        {row(t("pr.hub"), data.country ? names.country(data.country) : t("rfq.anyCountry"))}
        {row(t("rfq.qty"), data.quantity)}
        {row(t("pr.buyerEmail"), data.email)}
        {row(t("pr.answersBy"), data.respond_by ? new Date(data.respond_by).toLocaleDateString() : t("pr.noDeadline"))}
        {row(t("pr.details"), data.details)}
      </dl>
      <h2 className="mb-2 mt-8 text-base font-semibold">{fmt(t("pr.quotesRecv"), { n: data.rfq_applications.length })}</h2>
      {data.rfq_applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("pr.noQuotes")}</p>
      ) : (
        <div className="grid gap-3">
          {data.rfq_applications.map((a) => (
            <section key={a.id} className="break-inside-avoid rounded-lg border p-3 text-sm">
              <p className="font-medium">{a.company_name}{a.status === "accepted" ? ` ${t("pr.accepted")}` : ""}</p>
              <p className="text-xs text-muted-foreground">{t("pr.price")} {a.unit_price || "—"} · {t("db.leadTime")} {a.lead_time || "—"} · {t("dk.moq")} {a.min_order || "—"}</p>
              {a.message && <p className="mt-2 whitespace-pre-line">{a.message}</p>}
            </section>
          ))}
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground print:mt-4">{fmt(t("pr.printed"), { d: new Date().toLocaleDateString() })}</p>
    </article>
  );
}
