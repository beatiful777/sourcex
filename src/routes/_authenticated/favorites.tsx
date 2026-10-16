import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/sb";
import { PageHeader } from "@/components/blocks";
import { FavoriteButton } from "@/components/favorite-button";
import { useI18n } from "@/lib/i18n";
import { useNames } from "@/lib/names";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorite factories — SOURCEX" }] }),
  component: Favorites,
});

function Favorites() {
  const { t } = useI18n();
  const names = useNames();
  const { data, isLoading } = useQuery({
    queryKey: ["favorite-factories"],
    queryFn: async () => {
      const f = await sb.from("favorite_suppliers").select("supplier_id").order("created_at", { ascending: false });
      if (f.error) throw f.error;
      const ids = (f.data as { supplier_id: string }[]).map((r) => r.supplier_id);
      if (!ids.length) return [];
      const { data, error } = await supabase.from("supplier_applications").select("id, company_name, country, city, categories, logo_url").in("id", ids).eq("status", "approved");
      if (error) throw error;
      return ids.map((id) => data.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
    },
  });
  return (
    <>
      <PageHeader eyebrow={t("db.title")} title={t("fv.title")}>{t("fv.lead")}</PageHeader>
      <div className="container-page py-12">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("c.loading")}</p>
        ) : !data?.length ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("fv.none")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((s) => (
              <div key={s.id} className="rounded-xl border p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    {s.logo_url && s.logo_url.startsWith("https://") && <img src={s.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-md border object-contain" />}
                    <Link to="/factory/$id" params={{ id: s.id }} className="break-words font-medium hover:underline">{s.company_name}</Link>
                  </div>
                  <FavoriteButton supplierId={s.id} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{[s.city, s.country ? names.country(s.country) : null].filter(Boolean).join(", ") || t("sp.location")}</p>
                {s.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.categories.map((c) => <span key={c} className="rounded-md border px-2 py-0.5 text-xs">{names.category(c)}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
