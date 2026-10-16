import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sb } from "@/lib/sb";
import { useI18n, fmt } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Review = { id: string; rating: number; comment: string | null; created_at: string };

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value}/5`} className="text-amber-500">
      {"★".repeat(value)}<span className="text-muted-foreground/40">{"★".repeat(5 - value)}</span>
    </span>
  );
}

/** Public reviews of a factory. Every review comes from a buyer whose quote was accepted. */
export function SupplierReviews({ supplierId }: { supplierId: string }) {
  const { t } = useI18n();
  const { data, isError } = useQuery({
    queryKey: ["supplier-reviews", supplierId],
    queryFn: async () => {
      const { data, error } = await sb.from("reviews").select("id, rating, comment, created_at").eq("supplier_id", supplierId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as Review[];
    },
  });
  if (isError) return null;
  const list = data ?? [];
  const avg = list.length ? (list.reduce((n, r) => n + r.rating, 0) / list.length).toFixed(1) : null;
  return (
    <section className="mt-10 border-t pt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("rv.title")}</h2>
      {avg && <p className="mb-4 text-sm"><Stars value={Math.round(Number(avg))} /> {fmt(t("rv.avg"), { avg, n: list.length })}</p>}
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("rv.none")}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id} className="rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-xs text-accent-foreground"><BadgeCheck className="h-3 w-3" />{t("rv.verified")}</span>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Shown to the buyer under an accepted quote. The database refuses reviews for anything else. */
export function ReviewForm({ applicationId }: { applicationId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const existing = useQuery({
    queryKey: ["my-review", applicationId],
    queryFn: async () => {
      const { data, error } = await sb.from("reviews").select("rating, comment").eq("application_id", applicationId).maybeSingle();
      if (error) throw error;
      return data as { rating: number; comment: string | null } | null;
    },
  });
  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await sb.rpc("submit_review", { _application: applicationId, _rating: rating, _comment: comment });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("rv.ok"));
      qc.invalidateQueries({ queryKey: ["my-review", applicationId] });
      qc.invalidateQueries({ queryKey: ["supplier-reviews"] });
    },
    onError: (e: unknown) => toast.error((e as { code?: string })?.code === "23505" ? t("rv.already") : t("rv.fail")),
  });
  if (existing.isPending || existing.isError) return null;
  if (existing.data) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-xs">
        <p className="font-medium">{t("rv.done")} <Stars value={existing.data.rating} /></p>
        {existing.data.comment && <p className="mt-1 whitespace-pre-line text-muted-foreground">{existing.data.comment}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-xs font-medium">{t("rv.leave")} <span className="font-normal text-muted-foreground">· {t("rv.verified")}</span></p>
      <div role="radiogroup" aria-label={t("rv.rating")} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}/5`} onClick={() => setRating(n)} className={cn("text-2xl leading-none", n <= rating ? "text-amber-500" : "text-muted-foreground/40")}>★</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={2} placeholder={t("rv.comment")} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none" />
      <Button size="sm" disabled={!rating || submit.isPending} onClick={() => submit.mutate()}>{t("rv.submit")}</Button>
    </div>
  );
}
