import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/supplier/profile")({
  head: () => ({ meta: [{ title: "Factory profile — SOURCEX" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

type P = { id: string; company_name: string; country: string | null; categories: string[]; factory_details: string | null; min_order_quantity: string | null; certifications: string[]; website_or_catalog: string | null; status: string; logo_url: string | null };

const norm = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))].sort().join("|");

function Profile() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-factory-profile"],
    queryFn: async () => { const { data, error } = await supabase.rpc("my_factory_profile"); if (error) throw error; return ((data ?? [])[0] ?? null) as P | null; },
  });
  const [f, setF] = useState({ company_name: "", country: "", categories: [] as string[], factory_details: "", min_order_quantity: "", certifications: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  useEffect(() => {
    if (data) {
      setF({ company_name: data.company_name, country: data.country ?? "", categories: data.categories ?? [], factory_details: data.factory_details ?? "", min_order_quantity: data.min_order_quantity ?? "", certifications: (data.certifications ?? []).join(", "), website: data.website_or_catalog ?? "" });
      setLogoUrl(data.logo_url ?? null);
    }
  }, [data]);

  if (isLoading) return <div className="container-page py-12 text-sm text-muted-foreground">Loading…</div>;
  if (!data)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold">No factory application yet</h1>
        <Button asChild className="mt-6"><Link to="/become-a-supplier">Apply as a supplier</Link></Button>
      </div>
    );
  const p = data;
  const locked = p.status === "rejected";
  const keyChanged = f.company_name.trim().toLowerCase() !== p.company_name.trim().toLowerCase() || f.country !== (p.country ?? "") || norm(f.categories) !== norm(p.categories ?? []);
  const reReview = keyChanged && p.status === "approved";

  async function onLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.error("Logo must be PNG, JPG, WEBP or SVG");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      e.target.value = "";
      return;
    }
    setLogoBusy(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${p.id}/${Date.now()}-${safe}`;
    const { error: up } = await supabase.storage.from("logos").upload(path, file, { contentType: file.type });
    if (up) { setLogoBusy(false); toast.error("Upload failed", { description: up.message }); e.target.value = ""; return; }
    const publicUrl = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
    const { error: dbErr } = await supabase.rpc("update_factory_logo", { _id: p.id, _logo_url: publicUrl });
    setLogoBusy(false);
    e.target.value = "";
    if (dbErr) { toast.error("Couldn't save logo", { description: dbErr.message }); return; }
    setLogoUrl(publicUrl);
    toast.success("Logo updated");
    qc.invalidateQueries({ queryKey: ["my-factory-profile"] });
    qc.invalidateQueries({ queryKey: ["my-approved-supplier"] });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (reReview && !confirm("Changing the company name, country or categories sends your profile back to review. It will leave the directory and you can't quote until it is approved again. Continue?")) return;
    let web = f.website.trim();
    if (web && !/^https?:\/\//i.test(web)) web = `https://${web}`;
    setBusy(true);
    const { data: status, error } = await supabase.rpc("update_factory_profile", {
      _id: p.id, _company_name: f.company_name, _country: f.country, _categories: f.categories, _factory_details: f.factory_details,
      _min_order_quantity: f.min_order_quantity, _certifications: f.certifications.split(",").map((c) => c.trim()).filter(Boolean), _website: web,
    });
    setBusy(false);
    if (error) { toast.error("Couldn't save", { description: error.message }); return; }
    toast.success(status === "pending" && p.status === "approved" ? "Saved. Sent back for review" : "Profile saved");
    qc.invalidateQueries({ queryKey: ["my-factory-profile"] });
    qc.invalidateQueries({ queryKey: ["my-approved-supplier"] });
  }

  return (
    <>
      <PageHeader eyebrow={`Status: ${p.status}`} title="Factory profile">
        {p.status === "approved" ? "Description, minimum order, certifications and website update immediately. Name, country and categories need a new review." : p.status === "pending" ? "Your profile is waiting for review. You can keep editing it." : "This application was rejected and can't be edited."}
      </PageHeader>
      <form onSubmit={save} className="container-page grid max-w-2xl gap-5 py-12">
        <div className="grid gap-2 rounded-xl border p-5 sm:flex sm:items-center sm:gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-xs text-muted-foreground">
            {logoUrl ? <img src={logoUrl} alt={`${p.company_name} logo`} className="h-full w-full object-contain" /> : "No logo"}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fp-logo">Factory logo</Label>
            <input
              id="fp-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={locked || logoBusy}
              onChange={onLogoPick}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP or SVG, up to 2 MB. Shows up in your profile immediately.
            </p>
          </div>
        </div>
        <fieldset disabled={locked || busy} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="fp-name">Company name</Label><Input id="fp-name" value={f.company_name} maxLength={120} onChange={(e) => setF({ ...f, company_name: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label htmlFor="fp-country">Country</Label>
              <select id="fp-country" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
                <option value="">Select…</option>{COUNTRIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select></div>
          </div>
          <div className="grid gap-1.5"><Label>Categories</Label>
            <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => { const on = f.categories.includes(c.name); return (
              <button type="button" key={c.slug} onClick={() => setF({ ...f, categories: on ? f.categories.filter((x) => x !== c.name) : [...f.categories, c.name] })} className={cn("rounded-md border px-3 py-1.5 text-sm", on ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}>{c.name}</button>); })}</div></div>
          <div className="grid gap-1.5"><Label htmlFor="fp-det">Factory description</Label><Textarea id="fp-det" rows={7} maxLength={2000} value={f.factory_details} onChange={(e) => setF({ ...f, factory_details: e.target.value })} /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="fp-moq">Minimum order</Label><Input id="fp-moq" maxLength={60} value={f.min_order_quantity} onChange={(e) => setF({ ...f, min_order_quantity: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label htmlFor="fp-cert">Certifications (comma separated)</Label><Input id="fp-cert" value={f.certifications} onChange={(e) => setF({ ...f, certifications: e.target.value })} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="fp-web">Website or catalog link</Label><Input id="fp-web" maxLength={255} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" /></div>
        </fieldset>
        {reReview && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">You changed the name, country or categories. Saving sends the profile back to review.</p>}
        {!locked && <Button type="submit" disabled={busy} className="justify-self-start">{busy ? "Saving…" : "Save changes"}</Button>}
      </form>
    </>
  );
}
