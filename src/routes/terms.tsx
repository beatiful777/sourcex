import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

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
  return <LegalPage doc="terms" />;
}
