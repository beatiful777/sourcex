import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

// Every rate is typed by the user. Nothing is pre-filled and no tariff or freight data is built in.
function num(v: string): number | null {
  const t = v.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function LandedCostCalculator() {
  const { t } = useI18n();
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("");
  const [shipping, setShipping] = useState("");
  const [dutyPct, setDutyPct] = useState("");
  const [dutyOnCif, setDutyOnCif] = useState(false);
  const [currency, setCurrency] = useState("");

  const r = useMemo(() => {
    const u = num(unit), q = num(qty), s = num(shipping), d = num(dutyPct);
    if ([u, q, s, d].some((x) => Number.isNaN(x))) return { error: true } as const;
    if (u === null || q === null) return null;
    const goods = u * q;
    const ship = s ?? 0;
    const dutyBase = dutyOnCif ? goods + ship : goods;
    const duty = dutyBase * ((d ?? 0) / 100);
    const total = goods + ship + duty;
    return { goods, ship, duty, total, perUnit: q > 0 ? total / q : null, shipEntered: s !== null, dutyEntered: d !== null } as const;
  }, [unit, qty, shipping, dutyPct, dutyOnCif]);

  const cur = currency.trim().toUpperCase().slice(0, 5);
  const money = (n: number) => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${cur ? ` ${cur}` : ""}`;

  return (
    <div className="mb-8 grid gap-4 rounded-xl border p-6 md:p-8" id="landed-cost">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        <h2 className="text-base font-semibold">{t("calc.title")}</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{t("calc.badge")}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("calc.desc")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5"><Label htmlFor="lc-unit">{t("calc.unit")}</Label><Input id="lc-unit" inputMode="decimal" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="lc-qty">{t("rfq.qty")}</Label><Input id="lc-qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="lc-ship">{t("calc.ship")}</Label><Input id="lc-ship" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="lc-duty">{t("calc.duty")}</Label><Input id="lc-duty" inputMode="decimal" value={dutyPct} onChange={(e) => setDutyPct(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="lc-cur">{t("calc.cur")}</Label><Input id="lc-cur" maxLength={5} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder={t("calc.curPh")} /></div>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={dutyOnCif} onChange={(e) => setDutyOnCif(e.target.checked)} />{t("calc.onCif")}</label>
      </div>
      {r && "error" in r ? <p className="text-sm text-destructive">{t("calc.err")}</p> : null}
      {r && !("error" in r) ? (
        <dl className="grid gap-1 rounded-lg bg-muted/40 p-4 text-sm" aria-live="polite">
          <div className="flex justify-between"><dt>{t("calc.goods")}</dt><dd>{money(r.goods)}</dd></div>
          <div className="flex justify-between"><dt>{t("calc.shipping")}{r.shipEntered ? "" : ` ${t("calc.notEntered")}`}</dt><dd>{money(r.ship)}</dd></div>
          <div className="flex justify-between"><dt>{t("calc.dutyRow")}{r.dutyEntered ? "" : ` ${t("calc.notEntered")}`}</dt><dd>{money(r.duty)}</dd></div>
          <div className="mt-1 flex justify-between border-t pt-2 font-semibold"><dt>{t("calc.total")}</dt><dd>{money(r.total)}</dd></div>
          {r.perUnit !== null ? <div className="flex justify-between text-muted-foreground"><dt>{t("calc.perUnit")}</dt><dd>{money(r.perUnit)}</dd></div> : null}
        </dl>
      ) : null}
      {!r ? <p className="text-xs text-muted-foreground">{t("calc.hint")}</p> : null}
    </div>
  );
}
