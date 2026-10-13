import { useState, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  company: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Enter a valid email").max(255),
  quantity: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(2000),
});

export function InquiryDialog({ target, trigger }: { target: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const v = parsed.data;
    const body = `Inquiry: ${target}\nCompany: ${v.company ?? "-"}\nQuantity: ${v.quantity ?? "-"}\n\n${v.message}`;
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name: v.name, email: v.email, message: body });
    if (error) {
      toast.error("Couldn't send your inquiry", { description: "Please try again in a moment." });
      return;
    }
    toast.success("Inquiry sent", { description: "We received your message and will reply by email." });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Send Inquiry</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send inquiry</DialogTitle>
          <DialogDescription>To: {target}. We route your request to verified suppliers once available.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Full name" error={errors["name"]} />
            <Field name="company" label="Company (optional)" error={errors["company"]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label="Work email" type="email" error={errors["email"]} />
            <Field name="quantity" label="Quantity (optional)" placeholder="e.g. 5,000 units" error={errors["quantity"]} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="message">Requirements</Label>
            <Textarea id="message" name="message" rows={4} placeholder="Product, specs, target price, timeline…" />
            {errors["message"] && <p className="text-xs text-destructive">{errors["message"]}</p>}
          </div>
          <Button type="submit" className="w-full">Send Inquiry</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ name, label, type = "text", placeholder, error }: { name: string; label: string; type?: string; placeholder?: string; error?: string | undefined }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
