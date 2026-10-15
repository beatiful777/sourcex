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
import { useI18n, fmt } from "@/lib/i18n";
import type { Key } from "@/lib/translations";

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
  name: z.string().trim().min(2, "err.name").max(100),
  email: z.string().trim().email("err.email").max(255),
  message: z.string().trim().min(10, "err.message").max(4000),
});

function Contact() {
  const { t } = useI18n();
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
      toast.error(t("ct.fail"), { description: t("ct.failD") });
      return;
    }
    form.reset();
    setSent(true);
  }

  return (
    <>
      <PageHeader eyebrow={t("ct.eyebrow")} title={t("ct.title")}>
        {t("ct.lead")}
      </PageHeader>
      <div className="container-page py-12">
        <div className="mx-auto max-w-xl">
          {sent ? (
            <div className="rounded-xl border bg-subtle p-6 text-sm">
              <p className="font-semibold">{t("ct.sentH")}</p>
              <p className="mt-2 text-muted-foreground">{t("ct.sentP")}</p>
              <Button className="mt-4" variant="outline" size="sm" onClick={() => setSent(false)}>
                {t("ct.another")}
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">{t("ct.name")}</Label>
                  <Input id="name" name="name" autoComplete="name" />
                  {errors["name"] && <p className="text-xs text-destructive">{t(errors["name"] as Key)}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">{t("ct.email")}</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" />
                  {errors["email"] && <p className="text-xs text-destructive">{t(errors["email"] as Key)}</p>}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="message">{t("ct.msg")}</Label>
                <Textarea id="message" name="message" rows={6} />
                {errors["message"] && <p className="text-xs text-destructive">{t(errors["message"] as Key)}</p>}
              </div>
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? t("c.sending") : t("ct.send")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
