import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n, fmt } from "@/lib/i18n";
import type { Key } from "@/lib/translations";

const schema = z.object({
  product: z.string().trim().min(1, "err.sampleProduct").max(150),
  quantity: z.coerce.number().int("err.whole").min(1, "err.min1").max(1000, "err.max1000"),
  message: z.string().trim().max(1000).optional(),
});

/** Buyer asks one approved factory for a sample. Written via the request_sample() database function. */
export function SampleRequestButton({ supplierId, company }: { supplierId: string; company: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: user } = useQuery({ queryKey: ["auth-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });

  if (!user)
    return <Button asChild size="sm" variant="outline"><Link to="/sign-in">{t("sr.signIn")}</Link></Button>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const v = parsed.data;
    const { error } = await supabase.rpc("request_sample", { _supplier: supplierId, _product: v.product, _quantity: v.quantity, _message: v.message ?? "" });
    setBusy(false);
    if (error) { toast.error(t("sr.fail"), { description: error.message }); return; }
    toast.success(t("sr.ok"), { description: t("sr.okD") });
    qc.invalidateQueries({ queryKey: ["my-samples"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">{t("sr.btn")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fmt(t("sr.title"), { company })}</DialogTitle>
          <DialogDescription>{t("sr.desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="sr-product">{t("rfq.product")}</Label><Input id="sr-product" name="product" maxLength={150} />{errors["product"] && <p className="text-xs text-destructive">{t(errors["product"] as Key)}</p>}</div>
          <div className="grid gap-1.5"><Label htmlFor="sr-qty">{t("sr.qty")}</Label><Input id="sr-qty" name="quantity" type="number" min={1} max={1000} defaultValue={1} />{errors["quantity"] && <p className="text-xs text-destructive">{t(errors["quantity"] as Key)}</p>}</div>
          <div className="grid gap-1.5"><Label htmlFor="sr-msg">{t("sr.note")}</Label><Textarea id="sr-msg" name="message" rows={3} maxLength={1000} /></div>
          <Button type="submit" disabled={busy}>{busy ? t("c.sending") : t("sr.send")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
