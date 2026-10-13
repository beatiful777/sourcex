import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WaitlistForm({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = z.string().trim().email().max(255).safeParse(new FormData(form).get("email"));
    if (!email.success) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.from("waitlist").insert({ email: email.data, country_code: countryCode });
    setBusy(false);
    if (error && error.code !== "23505") { toast.error("Couldn't join the waitlist"); return; }
    form.reset();
    toast.success(`You're on the ${countryName} waitlist`);
  }
  return (
    <form onSubmit={onSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
      <Input name="email" type="email" placeholder="you@company.com" aria-label="Email" />
      <Button type="submit" disabled={busy}>Notify me</Button>
    </form>
  );
}
