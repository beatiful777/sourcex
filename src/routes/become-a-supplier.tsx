import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/become-a-supplier")({
  head: () => ({
    meta: [
      { title: "Apply as a Founding Supplier — SOURCEX" },
      { name: "description", content: "Apply to join the SOURCEX founding supplier network. Reviewed by hand, zero fees for six months." },
      { property: "og:title", content: "Apply as a Founding Supplier — SOURCEX" },
      { property: "og:description", content: "Be the first factory in a directory with zero fake profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BecomeSupplier,
});

const business = z.object({
  company_name: z.string().trim().min(2, "Enter your company name").max(120),
  contact_name: z.string().trim().min(2, "Enter a contact name").max(100),
  business_email: z.string().trim().email("Enter a valid email").max(255),
  country: z.string().min(1, "Select your country"),
  city: z.string().trim().max(80).optional(),
  website_or_catalog: z.string().trim().max(255).optional(),
});

const capability = z.object({
  categories: z.array(z.string()).min(1, "Pick at least one category"),
  min_order_quantity: z.string().trim().max(60).optional(),
  certifications: z.string().trim().max(400).optional(),
});

const facility = z.object({
  factory_details: z.string().trim().min(20, "Tell us about your factory (20+ characters)").max(2000),
});

const STEPS = [
  { title: "Business details", schema: business },
  { title: "Production capabilities", schema: capability },
  { title: "Contact & facility", schema: facility },
] as const;

type Form = z.infer<typeof business> & z.infer<typeof capability> & z.infer<typeof facility>;

const emptyForm: Form = {
  company_name: "",
  contact_name: "",
  business_email: "",
  country: "",
  city: "",
  website_or_catalog: "",
  categories: [],
  min_order_quantity: "",
  certifications: "",
  factory_details: "",
};

export function BecomeSupplier() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email;
      if (email) setForm((f) => ({ ...f, business_email: f.business_email || email }));
    });
  }, []);

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  function next() {
    const schema = step === 0 ? business : step === 1 ? capability : facility;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    const parsed = facility.safeParse(form);
    if (!parsed.success) {
      setErrors({ factory_details: parsed.error.issues[0]?.message ?? "Please complete this field" });
      return;
    }
    setErrors({});
    setBusy(true);
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("supplier_applications").insert({
      user_id: session.session?.user.id ?? null,
      company_name: form.company_name,
      contact_name: form.contact_name,
      business_email: form.business_email,
      country: form.country || null,
      city: form.city || null,
      website_or_catalog: form.website_or_catalog || null,
      categories: form.categories,
      min_order_quantity: form.min_order_quantity || null,
      certifications: form.certifications
        ? form.certifications.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      factory_details: form.factory_details,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't submit application", { description: "Please try again." });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <>
        <PageHeader eyebrow="Application received" title="Thank you">
          We review every factory by hand — no automatic listings.
        </PageHeader>
        <div className="container-page max-w-xl py-12">
          <div className="rounded-xl border p-6 text-center md:p-8">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border bg-accent">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Your application is in the queue</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team will check your facility and products, then reply within 24-48 hours. Approved factories are
              published in the supplier directory with a verified badge.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm">
                <Link to="/open-rfqs">Browse open RFQs</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/suppliers">Back to directory</Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Founding supplier program" title="Apply as a supplier">
        Three short steps. Applications are reviewed by a person, not a bot.
      </PageHeader>
      <div className="container-page max-w-2xl py-12">
        <ol className="mb-8 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
                i === step ? "border-primary bg-accent text-accent-foreground" : i < step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full border text-[10px]">
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.title}
            </li>
          ))}
        </ol>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === STEPS.length - 1) submit();
            else next();
          }}
          noValidate
          className="grid gap-5 rounded-xl border p-6 md:p-8"
        >
          {step === 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="company_name">Company name</Label>
                  <Input id="company_name" value={form.company_name} onChange={(e) => patch({ company_name: e.target.value })} placeholder="e.g. Delta Textiles Ltd." />
                  {err("company_name")}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="contact_name">Contact person</Label>
                  <Input id="contact_name" value={form.contact_name} onChange={(e) => patch({ contact_name: e.target.value })} placeholder="Full name" />
                  {err("contact_name")}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="business_email">Business email</Label>
                <Input id="business_email" type="email" value={form.business_email} onChange={(e) => patch({ business_email: e.target.value })} placeholder="you@factory.com" />
                {err("business_email")}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => patch({ country: e.target.value })}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="">Select…</option>
                    {COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                  {err("country")}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="city">City (optional)</Label>
                  <Input id="city" value={form.city ?? ""} onChange={(e) => patch({ city: e.target.value })} placeholder="e.g. Dhaka" />
                  {err("city")}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="website_or_catalog">Website or catalogue (optional)</Label>
                <Input id="website_or_catalog" value={form.website_or_catalog ?? ""} onChange={(e) => patch({ website_or_catalog: e.target.value })} placeholder="https://…" />
                {err("website_or_catalog")}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-1.5">
                <Label>What do you manufacture?</Label>
                <p className="text-xs text-muted-foreground">Pick every category you can actually produce.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = form.categories.includes(c.name);
                    return (
                      <button
                        type="button"
                        key={c.slug}
                        onClick={() =>
                          patch({
                            categories: on ? form.categories.filter((x) => x !== c.name) : [...form.categories, c.name],
                          })
                        }
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors",
                          on ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                {err("categories")}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="min_order_quantity">Minimum order quantity</Label>
                  <Input id="min_order_quantity" value={form.min_order_quantity ?? ""} onChange={(e) => patch({ min_order_quantity: e.target.value })} placeholder="e.g. 1,000 pcs" />
                  {err("min_order_quantity")}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input id="certifications" value={form.certifications ?? ""} onChange={(e) => patch({ certifications: e.target.value })} placeholder="e.g. ISO 9001, GOTS, BSCI" />
                  {err("certifications")}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="factory_details">Factory &amp; capacity</Label>
                <p className="text-xs text-muted-foreground">
                  Machines, lines, monthly output, main materials, export markets — anything that helps us verify you.
                </p>
                <Textarea
                  id="factory_details"
                  rows={8}
                  maxLength={2000}
                  value={form.factory_details}
                  onChange={(e) => patch({ factory_details: e.target.value })}
                  placeholder="e.g. 220 sewing machines across 8 lines, ~180,000 pcs/month, knitwear and fleece, exporting to the EU and UK since 2016…"
                />
                {err("factory_details")}
              </div>
              <div className="flex items-start gap-2 rounded-lg border bg-subtle p-4 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                We contact you within 24-48 hours. Your details are only used to verify your factory — we never list
                a company before it is approved.
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
              ) : step === STEPS.length - 1 ? (
                "Submit application"
              ) : (
                <>Continue <ChevronRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
