import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LandedCostCalculator } from "@/components/landed-cost-calculator";

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

// ---- file attachments -------------------------------------------------------
const MAX_FILES = 5;
const MAX_FILE_MB = 10;
const ALLOWED_EXT = [
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".pdf",
  ".dxf", ".dwg", ".step", ".stp", ".igs", ".iges",
  ".ai", ".psd", ".xlsx", ".docx", ".zip",
];

function fileAllowed(f: File) {
  const name = f.name.toLowerCase();
  if (f.type.startsWith("image/") || f.type === "application/pdf") return true;
  return ALLOWED_EXT.some((e) => name.endsWith(e));
}

function Rfq() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const bad = picked.find((f) => !fileAllowed(f));
    if (bad) { toast.error(`File type not allowed: ${bad.name}`); e.target.value = ""; return; }
    const big = picked.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (big) { toast.error(`${big.name} is larger than ${MAX_FILE_MB} MB`); e.target.value = ""; return; }
    if (picked.length > MAX_FILES) { toast.error(`Up to ${MAX_FILES} files`); e.target.value = ""; return; }
    setFiles(picked);
  }

  async function uploadFiles(rfqId: string) {
    let ok = 0;
    let fail = 0;
    for (const file of files) {
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${rfqId}/${Date.now()}-${safe}`;
      const { error: up } = await supabase.storage.from("rfq-files").upload(path, file, {
        contentType: file.type || undefined,
      });
      if (up) { fail++; continue; }
      const { error: ins } = await supabase.from("rfq_attachments").insert({
        rfq_id: rfqId,
        file_name: file.name,
        storage_path: path,
        size_bytes: file.size,
        content_type: file.type || null,
      });
      if (ins) {
        fail++;
        await supabase.storage.from("rfq-files").remove([path]);
      } else {
        ok++;
      }
    }
    return { ok, fail };
  }

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
    const { data: inserted, error } = await supabase.from("rfqs").insert({
      user_id: u.user?.id ?? null,
      email: v.email,
      product: v.product,
      category: v.category,
      country: v.country || null,
      quantity: v.quantity,
      details: v.details || null,
      response_days: Number(v.response_days),
    }).select("id").single();
    if (error) {
      setBusy(false);
      toast.error("Couldn't submit RFQ", { description: "Please try again." });
      return;
    }
    let fileNote = "";
    if (files.length && u.user) {
      const { ok, fail } = await uploadFiles(inserted.id);
      if (ok && !fail) fileNote = `${ok} file${ok > 1 ? "s" : ""} attached.`;
      else if (ok) fileNote = `${ok} file${ok > 1 ? "s" : ""} attached, ${fail} failed.`;
      else fileNote = "Files couldn't be attached.";
    }
    setBusy(false);
    form.reset();
    setFiles([]);
    toast.success("RFQ submitted", {
      description: [
        u.user
          ? "It's on your dashboard — supplier applications will appear there."
          : "Sign in before posting to track supplier applications on your dashboard.",
        fileNote,
      ].filter(Boolean).join(" "),
    });
  }
  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;
  const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <>
      <PageHeader eyebrow="Request for quotation" title="Post an RFQ">
        Tell us what you need. One request reaches suppliers across relevant hubs.
      </PageHeader>
      <div className="container-page max-w-2xl py-12">
        <form onSubmit={onSubmit} noValidate className="grid gap-5 rounded-xl border p-6 md:p-8">
          <div className="grid gap-1.5"><Label htmlFor="product">Product</Label><Input id="product" name="product" placeholder="e.g. Organic cotton t-shirts, 180 gsm" />{err("product")}</div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="category">Category</Label>
              <select id="category" name="category" className={sel} defaultValue=""><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}</select>{err("category")}</div>
            <div className="grid gap-1.5"><Label htmlFor="country">Preferred hub (optional)</Label>
              <select id="country" name="country" className={sel} defaultValue=""><option value="">Any country</option>{COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" name="quantity" placeholder="e.g. 2,000 pcs" /></div>
            <div className="grid gap-1.5"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />{err("email")}</div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="response_days">Answers needed within</Label>
            <select id="response_days" name="response_days" className={sel} defaultValue="14"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>
            <p className="text-xs text-muted-foreground">After this date the RFQ is hidden from factories. You can extend it from your dashboard.</p></div>
          <div className="grid gap-1.5"><Label htmlFor="details">Details (optional)</Label><Textarea id="details" name="details" rows={4} placeholder="Specs, certifications, target price, delivery date…" /></div>
          <div className="grid gap-1.5">
            <Label htmlFor="rfq-files">Attach files (optional)</Label>
            {signedIn ? (
              <input
                id="rfq-files"
                type="file"
                multiple
                onChange={onPickFiles}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
              />
            ) : (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Sign in to attach photos or drawings. Guests can still submit the form without files.
              </p>
            )}
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.length} file{files.length > 1 ? "s" : ""} ready: {files.map((f) => f.name).join(", ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Up to {MAX_FILES} files, {MAX_FILE_MB} MB each. Photos, PDF or CAD drawings (DXF, DWG, STEP).
            </p>
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit RFQ"}</Button>
        </form>
        <LandedCostCalculator />
      </div>
    </>
  );
}
