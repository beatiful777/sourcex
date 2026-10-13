import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SOURCEX" },
      { name: "description", content: "How SOURCEX collects, uses and protects your data." },
      { property: "og:title", content: "Privacy Policy — SOURCEX" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 13 October 2026. SOURCEX is a working prototype in private beta.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        <section>
          <h2>1. What we collect</h2>
          <ul>
            <li><strong>Account data:</strong> your email address and password. Passwords are handled by our authentication provider and are not readable by us.</li>
            <li><strong>RFQs:</strong> the product, quantity, category, deadline and contact details you enter.</li>
            <li><strong>Supplier applications:</strong> company name, categories, contact details and other information you submit.</li>
            <li><strong>Messages:</strong> your name, email and message when you use the contact form or an inquiry form.</li>
            <li><strong>Waitlist:</strong> your email if you join the waitlist.</li>
          </ul>
        </section>
        <section>
          <h2>2. How we use it</h2>
          <p>To run your account, show your RFQs and quotes, review supplier applications, answer your messages and keep the service secure. We do not sell your data.</p>
        </section>
        <section>
          <h2>3. Who can see it</h2>
          <ul>
            <li>The SOURCEX administrators.</li>
            <li>Approved suppliers can see open RFQs that match their categories.</li>
            <li>Our service providers that run the site: database and sign-in hosting (Supabase) and website hosting (Vercel).</li>
          </ul>
        </section>
        <section>
          <h2>4. Cookies and local storage</h2>
          <p>We use browser storage only to keep you signed in. If CAPTCHA is enabled on the sign-in form, its provider (Cloudflare Turnstile) may process technical data to detect bots.</p>
        </section>
        <section>
          <h2>5. Your choices</h2>
          <p>You can ask us to correct or delete your account and data at any time via the contact form. We will act on reasonable requests.</p>
        </section>
        <section>
          <h2>6. Retention and security</h2>
          <p>We keep data while your account is active or while needed to run the service. We use access controls on our database, but no online service is perfectly secure.</p>
        </section>
        <section>
          <h2>7. Changes</h2>
          <p>We may update this policy and will change the date above when we do.</p>
        </section>
        <section>
          <h2>Questions</h2>
          <p>Use our <Link to="/contact" className="text-primary underline">contact form</Link>.</p>
        </section>
      </div>
    </div>
  );
}
