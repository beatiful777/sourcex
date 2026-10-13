import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SOURCEX" },
      { name: "description", content: "Send a message to the SOURCEX team." },
      { property: "og:title", content: "Contact — SOURCEX" },
      { property: "og:description", content: "Questions, partnership ideas or problems: send us a message." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(4000),
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    // Hidden field: real people never fill it, simple bots do.
    if (typeof raw["website"] === "string" && raw["website"].length > 0) {
      setSent(true);
      return;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setBusy(false);
    if (error) {
      toast.error("Couldn't send your message", { description: "Please try again in a moment." });
      return;
    }
    form.reset();
    setSent(true);
  }

  return (
    <>
      <PageHeader eyebrow="Contact" title="Send us a message">
        Describe your question or problem. We read every message and reply to the email you leave.
      </PageHeader>
      <div className="container-page py-12">
        <div className="mx-auto max-w-xl">
          {sent ? (
            <div className="rounded-xl border bg-subtle p-6 text-sm">
              <p className="font-semibold">Message sent</p>
              <p className="mt-2 text-muted-foreground">Thank you. We will get back to you at the email you provided.</p>
              <Button className="mt-4" variant="outline" size="sm" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" name="name" autoComplete="name" />
                  {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Your email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" />
                  {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="message">What is the problem or question?</Label>
                <Textarea id="message" name="message" rows={6} />
                {errors["message"] && <p className="text-xs text-destructive">{errors["message"]}</p>}
              </div>
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
