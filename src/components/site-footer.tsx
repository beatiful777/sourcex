import { Link } from "@tanstack/react-router";
import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="border-t bg-subtle print:hidden">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Global B2B sourcing hub. Verified factories, comparable quotes, zero fake profiles.
          </p>
          <p className="text-sm text-muted-foreground">
            <a className="hover:text-foreground" href="mailto:zamick94@gmail.com">zamick94@gmail.com</a>
          </p>
        </div>
        <FooterCol title="For buyers">
          <Link to="/rfq">Post an RFQ</Link>
          <Link to="/suppliers">Find suppliers</Link>
          <Link to="/hubs">Country hubs</Link>
          <Link to="/how-it-works">How it works</Link>
        </FooterCol>
        <FooterCol title="For suppliers">
          <Link to="/become-a-supplier">Become a supplier</Link>
          <Link to="/open-rfqs">Browse open RFQs</Link>
          <Link to="/sign-in">Supplier sign in</Link>
        </FooterCol>
        <FooterCol title="Company">
          <Link to="/about">About</Link>
          <a href="mailto:zamick94@gmail.com">Contact</a>
          <Link to="/sign-in">Sign in</Link>
        </FooterCol>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} SOURCEX. Verified suppliers only.</span>
          <span>No supplier listings are shown until they are verified.</span>
        </div>
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
