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

const schema = z.object({
  product: z.string().trim().min(1, "Name the product").max(150),
  quantity: z.coerce.number().int("Whole number").min(1, "At least 1").max(1000, "At most 1000"),
  message: z.string().trim().max(1000).optional(),
});

/** Buyer asks one approved factory for a sample. Written via the request_sample() database function. */
export function SampleRequestButton({ supplierId, company }: { supplierId: string; company: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: user } = useQuery({ queryKey: ["auth-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });

  if (!user)
    return <Button asChild size="sm" variant="outline"><Link to="/sign-in">Sign in to request a sample</Link></Button>;

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
    if (error) { toast.error("Couldn't send the request", { description: error.message }); return; }
    toast.success("Sample request sent", { description: "Track it under Samples on your dashboard." });
    qc.invalidateQueries({ queryKey: ["my-samples"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Request a sample</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a sample from {company}</DialogTitle>
          <DialogDescription>The factory sees the product, quantity and your note. Your email is not shared. Don't put contact details in the note unless you want the factory to have them.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="sr-product">Product</Label><Input id="sr-product" name="product" maxLength={150} />{errors["product"] && <p className="text-xs text-destructive">{errors["product"]}</p>}</div>
          <div className="grid gap-1.5"><Label htmlFor="sr-qty">Number of sample pieces</Label><Input id="sr-qty" name="quantity" type="number" min={1} max={1000} defaultValue={1} />{errors["quantity"] && <p className="text-xs text-destructive">{errors["quantity"]}</p>}</div>
          <div className="grid gap-1.5"><Label htmlFor="sr-msg">Note (optional)</Label><Textarea id="sr-msg" name="message" rows={3} maxLength={1000} /></div>
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send request"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
