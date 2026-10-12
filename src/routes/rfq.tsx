import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { draftRfq } from "@/lib/rfq-ai.functions";
import { LandedCostCalculator } from "@/components/landed-cost-calculator";
type RfqDraft = Extract<Awaited<ReturnType<typeof draftRfq>>, { ok: true }>["draft"];

// The AI drafting box needs an AI provider key on the server. It is hidden unless VITE_AI_ENABLED="true" is set.
const AI_ENABLED = import.meta.env['VITE_AI_ENABLED'] === "true";

export const Route = createFileRoute("/rfq")({
  head: () => ({
    meta: [
      { title: "Post an RFQ — SOURCEX" },
      { name: "description", content: "Post a request for quotation to suppliers across global sourcing hubs." },
      { property: "og:title", content: "Post an RFQ — SOURCEX" },
      { property: "og:description", content: "One request, quotes from multiple countries." },
    ],
  }),
  component: Rfq,
});

const schema = z.object({
  product: z.string().trim().min(3, "Describe the product").max(150),
  category: z.string().min(1, "Choose a category"),
  country: z.string().optional(),
  quantity: z.string().trim().min(1, "Enter a quantity").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  details: z.string().trim().max(2000).optional(),
  response_days: z.enum(["7", "14", "30"]),
});

function Rfq() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [needs, setNeeds] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<RfqDraft | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [email, setEmail] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const v = parsed.data;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("rfqs").insert({
      user_id: u.user?.id ?? null,
      email: v.email,
      product: v.product,
      category: v.category,
      country: v.country || null,
      quantity: v.quantity,
      details: v.details || null,
      response_days: Number(v.response_days),
    });
    setBusy(false);
    if (error) { toast.error("Couldn't submit RFQ", { description: "Please try again." }); return; }
    form.reset();
    toast.success("RFQ submitted", {
      description: u.user ? "It's on your dashboard — supplier applications will appear there." : "Sign in before posting to track supplier applications on your dashboard.",
    });
  }
  async function onDraft() {
    if (needs.trim().length < 15) { toast.error("Tell us a bit more", { description: "Describe what you need in at least a sentence." }); return; }
    setDrafting(true);
    try {
      const res = await draftRfq({ data: { needs } });
      if (!res.ok) { toast.error("Couldn't draft RFQ", { description: res.error }); return; }
      setDraft(res.draft);
      setFormKey((k) => k + 1);
      setErrors({});
      toast.success("RFQ drafted", { description: "Review the fields below, add your email and submit." });
    } catch {
      toast.error("Couldn't draft RFQ", { description: "Please try again." });
    } finally {
      setDrafting(false);
    }
  }
  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;
  const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <>
      <PageHeader eyebrow="Request for quotation" title="Post an RFQ">
        Tell us what you need. One request reaches suppliers across relevant hubs.
      </PageHeader>
      <div className="container-page max-w-2xl py-12">
        {AI_ENABLED && (
        <div className="mb-8 grid gap-3 rounded-xl border bg-muted/40 p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <h2 className="text-base font-semibold">Describe it in your own words</h2>
          </div>
          <p className="text-sm text-muted-foreground">Write what you're looking for — our AI-powered assistant turns it into a clear RFQ suppliers can quote on.</p>
          <Textarea value={needs} onChange={(e) => setNeeds(e.target.value)} rows={4} maxLength={4000} placeholder="e.g. I need about 3,000 organic cotton hoodies in 4 colours with our logo embroidered, GOTS certified, delivered to Rotterdam by March, budget around $9 each…" />
          <Button type="button" variant="outline" onClick={onDraft} disabled={drafting} className="justify-self-start">
            {drafting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Drafting…</> : <><Wand2 className="mr-2 h-4 w-4" />Draft my RFQ</>}
          </Button>
        </div>
        )}
        <form key={formKey} onSubmit={onSubmit} noValidate className="grid gap-5 rounded-xl border p-6 md:p-8">
          <div className="grid gap-1.5"><Label htmlFor="product">Product</Label><Input id="product" name="product" defaultValue={draft?.product} placeholder="e.g. Organic cotton t-shirts, 180 gsm" />{err("product")}</div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="category">Category</Label>
              <select id="category" name="category" className={sel} defaultValue={draft?.category ?? ""}><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}</select>{err("category")}</div>
            <div className="grid gap-1.5"><Label htmlFor="country">Preferred hub (optional)</Label>
              <select id="country" name="country" className={sel} defaultValue={draft?.country ?? ""}><option value="">Any country</option>{COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" name="quantity" defaultValue={draft?.quantity} placeholder="e.g. 2,000 pcs" />{err("quantity")}</div>
            <div className="grid gap-1.5"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />{err("email")}</div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="response_days">Answers needed within</Label>
            <select id="response_days" name="response_days" className={sel} defaultValue="14"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>
            <p className="text-xs text-muted-foreground">After this date the RFQ is hidden from factories. You can extend it from your dashboard.</p></div>
          <div className="grid gap-1.5"><Label htmlFor="details">Details (optional)</Label><Textarea id="details" name="details" rows={draft ? 12 : 4} defaultValue={draft?.details} placeholder="Specs, certifications, target price, delivery date…" /></div>
          <Button type="submit" disabled={busy}>Submit RFQ</Button>
        </form>
        <div className="mt-8"><LandedCostCalculator /></div>
      </div>
    </>
  );
}
