import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { sb, useMyId } from "@/lib/sb";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function FavoriteButton({ supplierId }: { supplierId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const me = useMyId();
  const favs = useQuery({
    queryKey: ["my-favorites", me.data],
    enabled: !!me.data,
    queryFn: async () => {
      const { data, error } = await sb.from("favorite_suppliers").select("supplier_id");
      if (error) throw error;
      return new Set<string>((data as { supplier_id: string }[]).map((r) => r.supplier_id));
    },
  });
  const on = !!favs.data?.has(supplierId);
  const toggle = useMutation({
    mutationFn: async () => {
      const { error } = on
        ? await sb.from("favorite_suppliers").delete().eq("supplier_id", supplierId)
        : await sb.from("favorite_suppliers").insert({ supplier_id: supplierId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-favorites"] });
      qc.invalidateQueries({ queryKey: ["favorite-factories"] });
    },
    onError: () => toast.error(t("fv.fail")),
  });
  const cls = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground";
  if (me.data === null) {
    return (
      <Link to="/sign-in" aria-label={t("fv.signIn")} title={t("fv.signIn")} className={cls}>
        <Heart className="h-3.5 w-3.5" />
      </Link>
    );
  }
  const label = on ? t("fv.remove") : t("fv.add");
  return (
    <button type="button" disabled={toggle.isPending || me.isPending} aria-pressed={on} aria-label={label} title={label} onClick={() => toggle.mutate()} className={cn(cls, on && "border-red-300 text-red-500")}>
      <Heart className={cn("h-3.5 w-3.5", on && "fill-current")} />
    </button>
  );
}
