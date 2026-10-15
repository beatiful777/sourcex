import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

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
  return <LegalPage doc="privacy" />;
}
