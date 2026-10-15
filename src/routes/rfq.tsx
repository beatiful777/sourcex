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
import { useI18n, fmt } from "@/lib/i18n";
import { useNames } from "@/lib/names";
import type { Key } from "@/lib/translations";

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
  product: z.string().trim().min(3, "err.product").max(150),
  category: z.string().min(1, "err.category"),
  country: z.string().optional(),
  quantity: z.string().trim().min(1, "err.quantity").max(60),
  email: z.string().trim().email("err.email").max(255),
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
  const { t } = useI18n();
  const names = useNames();
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
    if (bad) { toast.error(fmt(t("rfq.badType"), { name: bad.name })); e.target.value = ""; return; }
    const big = picked.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (big) { toast.error(fmt(t("rfq.tooBig"), { name: big.name, mb: MAX_FILE_MB })); e.target.value = ""; return; }
    if (picked.length > MAX_FILES) { toast.error(fmt(t("rfq.tooMany"), { max: MAX_FILES })); e.target.value = ""; return; }
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
      toast.error(t("rfq.fail"), { description: t("c.tryAgain") });
      return;
    }
    let fileNote = "";
    if (files.length && u.user) {
      const { ok, fail } = await uploadFiles(inserted.id);
      if (ok && !fail) fileNote = fmt(t("rfq.filesOk"), { ok });
      else if (ok) fileNote = fmt(t("rfq.filesPartial"), { ok, fail });
      else fileNote = t("rfq.filesNone");
    }
    setBusy(false);
    form.reset();
    setFiles([]);
    toast.success(t("rfq.ok"), {
      description: [
        u.user
          ? t("rfq.okAuth")
          : t("rfq.okGuest"),
        fileNote,
      ].filter(Boolean).join(" "),
    });
  }
  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{t(errors[k] as Key)}</p>;
  const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <>
      <PageHeader eyebrow={t("rfq.eyebrow")} title={t("ft.postRfq")}>
        {t("rfq.lead")}
      </PageHeader>
      <div className="container-page max-w-2xl py-12">
        <form onSubmit={onSubmit} noValidate className="grid gap-5 rounded-xl border p-6 md:p-8">
          <div className="grid gap-1.5"><Label htmlFor="product">{t("rfq.product")}</Label><Input id="product" name="product" placeholder={t("rfq.productPh")} />{err("product")}</div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="category">{t("rfq.category")}</Label>
              <select id="category" name="category" className={sel} defaultValue=""><option value="">{t("c.select")}</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{names.category(c.name)}</option>)}</select>{err("category")}</div>
            <div className="grid gap-1.5"><Label htmlFor="country">{t("rfq.hub")}</Label>
              <select id="country" name="country" className={sel} defaultValue=""><option value="">{t("rfq.anyCountry")}</option>{COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{names.country(c.name)}</option>)}</select></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="quantity">{t("rfq.qty")}</Label><Input id="quantity" name="quantity" placeholder={t("rfq.qtyPh")} />{err("quantity")}</div>
            <div className="grid gap-1.5"><Label htmlFor="email">{t("rfq.email")}</Label><Input id="email" name="email" type="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />{err("email")}</div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="response_days">{t("rfq.within")}</Label>
            <select id="response_days" name="response_days" className={sel} defaultValue="14"><option value="7">{t("rfq.d7")}</option><option value="14">{t("rfq.d14")}</option><option value="30">{t("rfq.d30")}</option></select>
            <p className="text-xs text-muted-foreground">{t("rfq.hidden")}</p></div>
          <div className="grid gap-1.5"><Label htmlFor="details">{t("rfq.details")}</Label><Textarea id="details" name="details" rows={4} placeholder={t("rfq.detailsPh")} /></div>
          <div className="grid gap-1.5">
            <Label htmlFor="rfq-files">{t("rfq.attach")}</Label>
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
                {t("rfq.signInAttach")}
              </p>
            )}
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {fmt(t("rfq.filesReady"), { n: files.length, names: files.map((f) => f.name).join(", ") })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {fmt(t("rfq.limits"), { max: MAX_FILES, mb: MAX_FILE_MB })}
            </p>
          </div>
          <Button type="submit" disabled={busy}>{busy ? t("c.submitting") : t("rfq.submit")}</Button>
        </form>
        <LandedCostCalculator />
      </div>
    </>
  );
}
