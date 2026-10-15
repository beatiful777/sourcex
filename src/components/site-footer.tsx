import { Link } from "@tanstack/react-router";
import { Logo } from "./site-header";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t bg-subtle print:hidden">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
        </div>
        <FooterCol title={t("ft.buyers")}>
          <Link to="/rfq">{t("ft.postRfq")}</Link>
          <Link to="/suppliers">{t("ft.findSuppliers")}</Link>
          <Link to="/hubs">{t("ft.hubs")}</Link>
          <Link to="/how-it-works">{t("ft.how")}</Link>
        </FooterCol>
        <FooterCol title={t("ft.suppliers")}>
          <Link to="/become-a-supplier">{t("ft.become")}</Link>
          <Link to="/open-rfqs">{t("ft.browseRfqs")}</Link>
          <Link to="/sign-in">{t("ft.supplierSignIn")}</Link>
        </FooterCol>
        <FooterCol title={t("ft.company")}>
          <Link to="/about">{t("ft.about")}</Link>
          <Link to="/contact">{t("ft.contact")}</Link>
          <Link to="/terms">{t("ft.terms")}</Link>
          <Link to="/privacy">{t("ft.privacy")}</Link>
          <Link to="/sign-in">{t("ft.signIn")}</Link>
        </FooterCol>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground [&>a:hover]:text-foreground">{children}</div>
    </div>
  );
}
