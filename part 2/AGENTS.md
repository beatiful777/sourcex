<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Signed-in pages live under src/routes/_authenticated/ (client-only gate redirects to /sign-in) — Supabase session lives in localStorage.
- Public forms (RFQ, waitlist) write directly via the browser client with RLS insert policies — no server code needed.
- AI features call Lovable AI Gateway from server-only `*.server.ts` modules via `createServerFn` wrappers in `*.functions.ts` — keeps the API key off the client.
- Suppliers read open RFQs only through the list_open_rfqs() database function, which hides the buyer's email; applications live in rfq_applications, visible to the applying supplier and the RFQ owner.
- The public supplier directory reads only supplier_applications rows with status 'approved'; never list a company that has not applied and been approved, so the page degrades to the founding-network banner instead of placeholder listings.
- Staff-only actions (approving or rejecting a factory application) check public.has_role() against public.user_roles in RLS policies — never a client-side role check or a hardcoded email.
- A supplier's own quote history comes from the my_quotes() function, which joins rfq_applications to rfqs without exposing the buyer's email.
- Quotes are written only through `submit_quote()` (approved factory, company name and email taken from the profile); direct inserts into rfq_applications are revoked. `/open-rfqs` is a read-only board that links to the RFQ Desk.
- A buyer accepts a quote through `accept_quote()`; the RFQ becomes `in_progress`, and a closed RFQ must be re-opened first.
- Email (factory approved, new quote, quote accepted) is sent from server functions in `src/lib/notifications.functions.ts` via Resend, after the database change succeeds, at most once per event (`notification_log`). Secrets: `RESEND_API_KEY`, optional `RESEND_FROM`, `SITE_URL`. Without a key the change is still saved.
- The About page counters come from `public_platform_stats()` (numbers only).
- Sample requests (`sample_requests`) are written only through `request_sample()` and `set_sample_status()`; RLS lets a buyer read only their own rows and a factory only rows addressed to its approved profile. The table holds no buyer email; lists come from `my_sample_requests()` / `factory_sample_requests()`.
- A factory edits its profile only through `update_factory_profile()` (UI: `/supplier/profile`). Changing company name, country or categories sends an approved profile back to `pending`; rejected applications cannot be edited. Applicants have no direct UPDATE on `supplier_applications`.
- RFQ deadline: `rfqs.response_days` (7, 14 or 30) sets `respond_by` by trigger; "Expired" is derived (`status = 'open'` and `respond_by < now()`), hidden from factories in `list_open_rfqs()`, `supplier_desk_rfqs()`, `submit_quote()` and the public counters. A buyer extends through `extend_rfq()`. RFQs with `respond_by` NULL (created before 0008) never expire.
- The total-cost calculator on `/rfq` is client-side only: every rate is typed by the user, nothing is prefilled or saved, and results are labelled "estimate". The hub map on `/hubs` is drawn only from approved `supplier_applications` countries.
