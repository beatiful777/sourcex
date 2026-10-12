-- 0005: buyer accepts a quote, email log, public counters, and closing the unverified-quote hole.
-- Idempotent: safe to run more than once. Nothing is dropped except one unsafe INSERT policy.

-- 1) Quotes are written ONLY through submit_quote() (approved factories, name/email from the profile).
--    The old "supplier apply" policy let any signed-in user quote under any company name.
DROP POLICY IF EXISTS "supplier apply" ON public.rfq_applications;
REVOKE INSERT ON public.rfq_applications FROM authenticated;

-- 2) Buyer accepts (or un-accepts) one quote on their own RFQ.
CREATE OR REPLACE FUNCTION public.accept_quote(_quote uuid, _accepted boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _rfq uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT q.rfq_id INTO _rfq FROM public.rfq_applications q JOIN public.rfqs r ON r.id = q.rfq_id
   WHERE q.id = _quote AND r.user_id = auth.uid();
  IF _rfq IS NULL THEN RAISE EXCEPTION 'Quote not found or access denied'; END IF;
  PERFORM 1 FROM public.rfqs WHERE id = _rfq FOR UPDATE;
  IF _accepted AND EXISTS (SELECT 1 FROM public.rfqs WHERE id = _rfq AND status = 'closed') THEN
    RAISE EXCEPTION 'Re-open this RFQ before accepting a quote';
  END IF;
  IF _accepted THEN
    UPDATE public.rfq_applications SET status = CASE WHEN id = _quote THEN 'accepted' ELSE 'pending' END, updated_at = now() WHERE rfq_id = _rfq;
  ELSE
    UPDATE public.rfq_applications SET status = 'pending', updated_at = now() WHERE id = _quote;
  END IF;
  UPDATE public.rfqs SET status = CASE
    WHEN EXISTS (SELECT 1 FROM public.rfq_applications WHERE rfq_id = _rfq AND status = 'accepted') THEN 'in_progress'
    WHEN status = 'closed' THEN 'closed' ELSE 'open' END
   WHERE id = _rfq;
END $$;
REVOKE ALL ON FUNCTION public.accept_quote(uuid, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.accept_quote(uuid, boolean) TO authenticated;

-- 3) Each notification email is sent at most once (server only).
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  ref_id uuid NOT NULL,
  recipient text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref_id, recipient)
);
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.notification_log TO service_role;

-- 4) Counters for the About page: numbers only, no personal data, no table access for visitors.
CREATE OR REPLACE FUNCTION public.public_platform_stats()
RETURNS TABLE (suppliers integer, countries integer, open_rfqs integer, quotes integer, accepted_deals integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    (SELECT count(*) FROM public.supplier_applications WHERE status = 'approved')::int,
    (SELECT count(DISTINCT country) FROM public.supplier_applications WHERE status = 'approved' AND country IS NOT NULL)::int,
    (SELECT count(*) FROM public.rfqs WHERE status = 'open')::int,
    (SELECT count(*) FROM public.rfq_applications)::int,
    (SELECT count(*) FROM public.rfq_applications WHERE status = 'accepted')::int
$$;
REVOKE ALL ON FUNCTION public.public_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_platform_stats() TO anon, authenticated;
