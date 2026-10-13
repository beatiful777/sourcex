import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SOURCEX" },
      { name: "description", content: "Terms of using the SOURCEX B2B sourcing platform." },
      { property: "og:title", content: "Terms of Service — SOURCEX" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 13 October 2026. SOURCEX is a working prototype in private beta.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        <section>
          <h2>1. What SOURCEX is</h2>
          <p>SOURCEX is an online sourcing hub where buyers post requests for quotation (RFQs) and approved suppliers can respond. We are a platform for introductions only. We are not a party to any deal between a buyer and a supplier.</p>
        </section>
        <section>
          <h2>2. Accounts</h2>
          <p>You must provide accurate information and keep your password secure. You are responsible for activity under your account. We may suspend or remove accounts that break these terms or abuse the service.</p>
        </section>
        <section>
          <h2>3. Buyers</h2>
          <p>Post RFQs only for genuine sourcing needs. Do not post misleading, illegal or spam requests.</p>
        </section>
        <section>
          <h2>4. Suppliers</h2>
          <p>Suppliers are listed only after their application is reviewed and approved. You must give truthful company information. Changes to key profile details (such as categories) may require a new review. We may reject, suspend or remove a supplier at our discretion.</p>
        </section>
        <section>
          <h2>5. Quotes and deals</h2>
          <p>Quotes, prices, lead times and product quality are the responsibility of the supplier. Buyers and suppliers are responsible for their own agreements, payments, shipping and compliance with the law. We do not guarantee any supplier, buyer or outcome.</p>
        </section>
        <section>
          <h2>6. Acceptable use</h2>
          <ul>
            <li>No fake, misleading or fraudulent information.</li>
            <li>No attempts to break, overload or scrape the service.</li>
            <li>No harassment or unlawful content.</li>
          </ul>
        </section>
        <section>
          <h2>7. No warranty</h2>
          <p>The service is provided "as is" during private beta. It may change, be interrupted or be removed at any time. To the extent allowed by law, we are not liable for losses arising from use of the service.</p>
        </section>
        <section>
          <h2>8. Changes</h2>
          <p>We may update these terms. Continued use after an update means you accept the new version.</p>
        </section>
        <section>
          <h2>Questions</h2>
          <p>Use our <Link to="/contact" className="text-primary underline">contact form</Link>.</p>
        </section>
      </div>
    </div>
  );
}
