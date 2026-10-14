import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { decideApplicationFn } from "@/lib/notifications.functions";
import { AdminMessages } from "@/components/admin-messages";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Supplier Moderation — SOURCEX" },
      { name: "description", content: "Review founding supplier applications." },
      { property: "og:title", content: "Supplier Moderation — SOURCEX" },
      { property: "og:description", content: "Approve or reject factory applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSuppliers,
});

type Application = {
  id: string;
  created_at: string;
  company_name: string;
  contact_name: string;
  business_email: string;
  country: string | null;
  city: string | null;
  website_or_catalog: string | null;
  categories: string[];
  min_order_quantity: string | null;
  certifications: string[];
  factory_details: string | null;
  status: string;
};

function AdminSuppliers() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["my-role", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });

  const { data: apps, isLoading } = useQuery({
    queryKey: ["supplier-applications"],
    enabled: !!isAdmin,
    queryFn: async () => {
      // Contact columns are not readable through the public API, so staff read applications via a protected function.
      const { data, error } = await supabase.rpc("admin_list_applications");
      if (error) throw error;
      return data as Application[];
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    let email: string;
    try {
      ({ email } = await decideApplicationFn({ data: { id, status } }));
    } catch (e) {
      toast.error("Couldn't update application", { description: e instanceof Error ? e.message : undefined });
      return;
    }
    toast.success(status === "approved" ? "Factory approved and published" : "Application rejected", {
      description:
        email === "sent" ? "Approval email sent to the factory."
        : email === "already_sent" ? "The factory was already notified earlier."
        : email === "not_configured" ? "Email not sent: RESEND_API_KEY is not set."
        : email === "failed" ? "Saved, but the email could not be sent."
        : undefined,
    });
    qc.invalidateQueries({ queryKey: ["supplier-applications"] });
    qc.invalidateQueries({ queryKey: ["approved-factories"] });
  }

  if (roleLoading) return <p className="container-page py-12 text-sm text-muted-foreground">Loading…</p>;

  if (!isAdmin) {
    return (
      <>
        <PageHeader eyebrow="Restricted" title="No access">
          This page is for SOURCEX staff accounts only.
        </PageHeader>
        <div className="container-page py-12">
          <Button asChild variant="outline"><Link to="/dashboard">Back to my dashboard</Link></Button>
        </div>
      </>
    );
  }

  const rows = apps ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader eyebrow="Staff" title="Supplier applications">
        Approving a factory publishes it in the public directory with a verified badge.
      </PageHeader>
      <div className="container-page py-12">
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <div key={s} className="rounded-xl border p-5">
              <p className="text-2xl font-semibold">{count(s)}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{s}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No applications yet. They appear here as soon as a factory applies at /become-a-supplier.
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((a) => (
              <div key={a.id} className="rounded-xl border">
                <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.company_name}</p>
                      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">{a.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[a.city, a.country].filter(Boolean).join(", ") || "No location given"} ·{" "}
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={a.status === "approved"}
                      onClick={() => decide(a.id, "approved")}
                      className={a.status === "approved" ? "" : ""}
                    >
                      <ShieldCheck className="mr-1 h-4 w-4" />
                      {a.status === "approved" ? "Published" : "Approve"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={a.status === "rejected"} onClick={() => decide(a.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 bg-muted/30 p-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <p className="text-xs"><span className="font-medium">Contact:</span> {a.contact_name} ·{" "}
                      <a className="underline" href={`mailto:${a.business_email}`}>{a.business_email}</a></p>
                    <p className="text-xs"><span className="font-medium">Website:</span>{" "}
                      {a.website_or_catalog ? (
                        <a className="underline" href={a.website_or_catalog} target="_blank" rel="noreferrer">{a.website_or_catalog}</a>
                      ) : "—"}
                    </p>
                    <p className="text-xs"><span className="font-medium">Categories:</span> {a.categories.join(", ") || "—"}</p>
                    <p className="text-xs"><span className="font-medium">MOQ:</span> {a.min_order_quantity || "—"} ·{" "}
                      <span className="font-medium">Certifications:</span> {a.certifications.join(", ") || "—"}</p>
                  </div>
                  {a.factory_details && <p className="whitespace-pre-line text-sm">{a.factory_details}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <AdminMessages />
      </div>
    </>
  );
}
