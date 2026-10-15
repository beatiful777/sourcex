import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileText, ShieldCheck, Store } from "lucide-react";
import { flagUrl, type Country } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useNames } from "@/lib/names";

export function CountryCard({ c }: { c: Country }) {
  const { t } = useI18n();
  const names = useNames();
  return (
    <Link
      to="/hub/$country"
      params={{ country: c.slug }}
      className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <img src={flagUrl(c.code)} alt="" loading="lazy" className="h-6 w-9 rounded-sm border object-cover" />
        <div>
          <div className="text-sm font-medium">{names.country(c.name)}</div>
          <div className="text-xs text-muted-foreground">{t("bl.explore")}</div>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}

export function SuppliersEmpty({ note }: { note?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-subtle px-6 py-14 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border bg-background">
        <ShieldCheck className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 font-semibold">{t("bl.soonT")}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {note ?? t("bl.soonP")}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/rfq">{t("bl.rfqInstead")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/become-a-supplier">{t("bl.apply")}</Link>
        </Button>
      </div>
    </div>
  );
}

export function FoundingNetwork() {
  const { t } = useI18n();
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-subtle p-6 md:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="eyebrow">{t("bs.eyebrow")}</p>
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">
          {t("bl.fH")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          {t("bl.fP")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border p-6">
          <div className="grid h-10 w-10 place-items-center rounded-full border bg-subtle">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-4 font-semibold">{t("bl.applyH")}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            {t("bl.applyP")}
          </p>
          <Button asChild className="mt-5 justify-self-start">
            <Link to="/become-a-supplier">{t("bl.start")}</Link>
          </Button>
        </div>
        <div className="flex flex-col rounded-xl border p-6">
          <div className="grid h-10 w-10 place-items-center rounded-full border bg-subtle">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-4 font-semibold">{t("bl.needH")}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            {t("bl.needP")}
          </p>
          <Button asChild variant="outline" className="mt-5 justify-self-start">
            <Link to="/rfq">{t("ft.postRfq")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="border-b bg-subtle">
      <div className="container-page py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-muted-foreground">{children}</div>}
      </div>
    </section>
  );
}
