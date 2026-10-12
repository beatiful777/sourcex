-- 0008: RFQ response deadline ("answers needed by": 7, 14 or 30 days).
-- "Expired" is derived (status = 'open' AND respond_by < now()), so no scheduled job is needed.
-- Expired RFQs disappear from factories (board, desk, new quotes, public counters); the buyer sees "Expired" and can extend.
-- RFQs created before this migration have respond_by = NULL and never expire.
-- Idempotent.

ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS response_days smallint NOT NULL DEFAULT 14;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS respond_by timestamptz;
DO $$ BEGIN
  ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_response_days_check CHECK (response_days IN (7, 14, 30));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The deadline is always derived from the chosen number of days; clients cannot write an arbitrary date.
CREATE OR REPLACE FUNCTION public.rfqs_set_respond_by() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.respond_by := now() + make_interval(days => NEW.response_days);
  ELSIF (NEW.respond_by IS DISTINCT FROM OLD.respond_by OR NEW.response_days IS DISTINCT FROM OLD.response_days)
        AND current_user IN ('anon', 'authenticated') THEN
    -- browser roles cannot move the deadline directly; extend_rfq() runs as the function owner and can
    NEW.respond_by := OLD.respond_by;
    NEW.response_days := OLD.response_days;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rfqs_respond_by ON public.rfqs;
CREATE TRIGGER rfqs_respond_by BEFORE INSERT OR UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.rfqs_set_respond_by();

-- Buyer extends the deadline: from the current deadline if still running, otherwise from now.
CREATE OR REPLACE FUNCTION public.extend_rfq(_rfq uuid, _days integer)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.rfqs; new_by timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF _days IS NULL OR _days NOT IN (7, 14, 30) THEN RAISE EXCEPTION 'Choose 7, 14 or 30 days'; END IF;
  SELECT * INTO r FROM public.rfqs WHERE id = _rfq AND user_id = auth.uid() FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'RFQ not found or access denied'; END IF;
  IF r.status NOT IN ('open', 'closed') THEN RAISE EXCEPTION 'This RFQ is already in progress'; END IF;
  new_by := greatest(coalesce(r.respond_by, now()), now()) + make_interval(days => _days);
  UPDATE public.rfqs SET respond_by = new_by, response_days = _days WHERE id = _rfq;
  RETURN new_by;
END $$;
REVOKE ALL ON FUNCTION public.extend_rfq(uuid, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.extend_rfq(uuid, integer) TO authenticated;

-- Redefined with the same signatures; the only change is the "not expired" condition.
CREATE OR REPLACE FUNCTION public.list_open_rfqs()
RETURNS TABLE (id uuid, product text, category text, country text, quantity text, details text, created_at timestamptz, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.product, r.category, r.country, r.quantity, r.details, r.created_at, (r.user_id = auth.uid())
  FROM public.rfqs r
  WHERE r.status = 'open' AND (r.respond_by IS NULL OR r.respond_by > now()) AND auth.uid() IS NOT NULL
  ORDER BY r.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.supplier_desk_rfqs()
RETURNS TABLE(id uuid, product text, category text, country text, quantity text, details text, created_at timestamptz,
  quote_id uuid, unit_price text, lead_time text, min_order text, message text, quote_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH s AS (SELECT * FROM public.my_approved_supplier())
  SELECT r.id, r.product, r.category, r.country, r.quantity, r.details, r.created_at,
         a.id, a.unit_price, a.lead_time, a.min_order, a.message, a.status
  FROM public.rfqs r CROSS JOIN s
  LEFT JOIN public.rfq_applications a ON a.rfq_id = r.id AND a.supplier_id = auth.uid()
  WHERE ((r.status = 'open' AND (r.respond_by IS NULL OR r.respond_by > now())) OR (r.status <> 'open' AND a.id IS NOT NULL))
    AND public.cat_match(r.category, s.categories)
    AND r.user_id IS DISTINCT FROM auth.uid()
  ORDER BY r.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.submit_quote(_rfq uuid, _unit_price text, _lead_time text, _min_order text, _message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s record; r record; existing record; new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO s FROM public.my_approved_supplier();
  IF s.id IS NULL THEN RAISE EXCEPTION 'Only approved suppliers can quote'; END IF;
  SELECT * INTO r FROM public.rfqs WHERE id = _rfq;
  IF r.id IS NULL OR r.status <> 'open' THEN RAISE EXCEPTION 'This RFQ is not open'; END IF;
  IF r.respond_by IS NOT NULL AND r.respond_by <= now() THEN RAISE EXCEPTION 'This RFQ has expired'; END IF;
  IF r.user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot quote your own RFQ'; END IF;
  IF NOT public.cat_match(r.category, s.categories) THEN RAISE EXCEPTION 'RFQ category does not match your factory'; END IF;
  IF length(coalesce(_message,'')) < 1 OR length(_message) > 2000 THEN RAISE EXCEPTION 'Message must be 1-2000 characters'; END IF;
  IF length(coalesce(_unit_price,'')) > 60 OR length(coalesce(_lead_time,'')) > 60 OR length(coalesce(_min_order,'')) > 60 THEN RAISE EXCEPTION 'Field too long'; END IF;
  SELECT * INTO existing FROM public.rfq_applications WHERE rfq_id = _rfq AND supplier_id = auth.uid();
  IF existing.id IS NOT NULL THEN
    IF existing.status = 'accepted' THEN RAISE EXCEPTION 'Accepted quotes cannot be edited'; END IF;
    UPDATE public.rfq_applications SET unit_price=_unit_price, lead_time=_lead_time, min_order=_min_order,
      message=_message, company_name=s.company_name, supplier_email=s.business_email, updated_at=now()
      WHERE id = existing.id;
    RETURN existing.id;
  END IF;
  INSERT INTO public.rfq_applications(rfq_id, supplier_id, supplier_email, company_name, unit_price, lead_time, min_order, message)
  VALUES (_rfq, auth.uid(), s.business_email, s.company_name, _unit_price, _lead_time, _min_order, _message)
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.public_platform_stats()
RETURNS TABLE (suppliers integer, countries integer, open_rfqs integer, quotes integer, accepted_deals integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    (SELECT count(*) FROM public.supplier_applications WHERE status = 'approved')::int,
    (SELECT count(DISTINCT country) FROM public.supplier_applications WHERE status = 'approved' AND country IS NOT NULL)::int,
    (SELECT count(*) FROM public.rfqs WHERE status = 'open' AND (respond_by IS NULL OR respond_by > now()))::int,
    (SELECT count(*) FROM public.rfq_applications)::int,
    (SELECT count(*) FROM public.rfq_applications WHERE status = 'accepted')::int
$$;
