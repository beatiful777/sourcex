ALTER TABLE public.rfq_applications ADD COLUMN IF NOT EXISTS min_order text;
ALTER TABLE public.rfq_applications ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.rfq_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS rfq_applications_one_per_supplier ON public.rfq_applications(rfq_id, supplier_id);

CREATE OR REPLACE FUNCTION public.my_approved_supplier()
RETURNS TABLE(id uuid, company_name text, business_email text, categories text[], country text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT s.id, s.company_name, s.business_email, s.categories, s.country
  FROM public.supplier_applications s
  WHERE s.status = 'approved' AND auth.uid() IS NOT NULL
    AND (s.user_id = auth.uid() OR lower(s.business_email) = lower(coalesce(auth.jwt()->>'email','')))
  ORDER BY s.created_at DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.cat_match(_cat text, _cats text[])
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM unnest(_cats) c
    WHERE replace(lower(trim(c)),' ','-') = replace(lower(trim(_cat)),' ','-'))
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
  WHERE (r.status = 'open' OR a.id IS NOT NULL)
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

REVOKE ALL ON FUNCTION public.submit_quote(uuid,text,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_quote(uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.supplier_desk_rfqs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_approved_supplier() TO authenticated;