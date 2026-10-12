-- 0006: buyers request a sample from an approved factory; the factory sees only requests addressed to it.
-- Idempotent. Writes happen only through request_sample() / set_sample_status(); no direct INSERT/UPDATE/DELETE grants.
-- The buyer's email is never stored here, so a factory cannot read it.

CREATE TABLE IF NOT EXISTS public.sample_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_application_id uuid NOT NULL REFERENCES public.supplier_applications(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product text NOT NULL CHECK (length(product) BETWEEN 1 AND 150),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 1000),
  message text CHECK (message IS NULL OR length(message) <= 1000),
  supplier_note text CHECK (supplier_note IS NULL OR length(supplier_note) <= 1000),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','declined','shipped','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sample_requests_buyer_idx ON public.sample_requests (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sample_requests_supplier_idx ON public.sample_requests (supplier_application_id, created_at DESC);

ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sample_requests FROM PUBLIC, anon, authenticated;
-- Read-only for signed-in users, and not the buyer_id column (the factory does not need to know who the buyer is).
GRANT SELECT (id, supplier_application_id, product, quantity, message, supplier_note, status, created_at, updated_at)
  ON public.sample_requests TO authenticated;
GRANT ALL ON public.sample_requests TO service_role;

-- True when the signed-in user owns this APPROVED factory profile.
CREATE OR REPLACE FUNCTION public.is_factory_of(_app uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.supplier_applications s
    WHERE s.id = _app AND s.status = 'approved' AND auth.uid() IS NOT NULL
      AND (s.user_id = auth.uid() OR lower(s.business_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
$$;
REVOKE ALL ON FUNCTION public.is_factory_of(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_factory_of(uuid) TO authenticated;

DROP POLICY IF EXISTS "buyer reads own samples" ON public.sample_requests;
CREATE POLICY "buyer reads own samples" ON public.sample_requests
  FOR SELECT TO authenticated USING (buyer_id = auth.uid());
DROP POLICY IF EXISTS "factory reads its samples" ON public.sample_requests;
CREATE POLICY "factory reads its samples" ON public.sample_requests
  FOR SELECT TO authenticated USING (public.is_factory_of(supplier_application_id));

-- Buyer creates a request.
CREATE OR REPLACE FUNCTION public.request_sample(_supplier uuid, _product text, _quantity integer, _message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _p text := btrim(coalesce(_product, '')); _m text := nullif(btrim(coalesce(_message, '')), ''); new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.supplier_applications WHERE id = _supplier AND status = 'approved') THEN
    RAISE EXCEPTION 'Factory not found';
  END IF;
  IF public.is_factory_of(_supplier) THEN RAISE EXCEPTION 'You cannot request a sample from your own factory'; END IF;
  IF length(_p) < 1 OR length(_p) > 150 THEN RAISE EXCEPTION 'Product must be 1-150 characters'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 1000 THEN RAISE EXCEPTION 'Quantity must be 1-1000'; END IF;
  IF _m IS NOT NULL AND length(_m) > 1000 THEN RAISE EXCEPTION 'Message is too long'; END IF;
  IF EXISTS (SELECT 1 FROM public.sample_requests WHERE buyer_id = auth.uid() AND supplier_application_id = _supplier
             AND status IN ('requested','accepted') AND lower(product) = lower(_p)) THEN
    RAISE EXCEPTION 'You already have an active sample request for this product';
  END IF;
  IF (SELECT count(*) FROM public.sample_requests WHERE buyer_id = auth.uid() AND status = 'requested') >= 10 THEN
    RAISE EXCEPTION 'Too many pending sample requests';
  END IF;
  INSERT INTO public.sample_requests (supplier_application_id, buyer_id, product, quantity, message)
  VALUES (_supplier, auth.uid(), _p, _quantity, _m) RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.request_sample(uuid, text, integer, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_sample(uuid, text, integer, text) TO authenticated;

-- Status changes. Factory: requested -> accepted | declined, accepted -> shipped. Buyer: requested | accepted -> cancelled.
CREATE OR REPLACE FUNCTION public.set_sample_status(_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.sample_requests; _n text := nullif(btrim(coalesce(_note, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF _n IS NOT NULL AND length(_n) > 1000 THEN RAISE EXCEPTION 'Note is too long'; END IF;
  SELECT * INTO r FROM public.sample_requests WHERE id = _id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Sample request not found or access denied'; END IF;
  IF public.is_factory_of(r.supplier_application_id) THEN
    IF NOT ((r.status = 'requested' AND _status IN ('accepted','declined')) OR (r.status = 'accepted' AND _status = 'shipped')) THEN
      RAISE EXCEPTION 'Cannot change status from % to %', r.status, _status;
    END IF;
    UPDATE public.sample_requests SET status = _status, supplier_note = coalesce(_n, supplier_note), updated_at = now() WHERE id = _id;
  ELSIF r.buyer_id = auth.uid() THEN
    IF NOT (r.status IN ('requested','accepted') AND _status = 'cancelled') THEN
      RAISE EXCEPTION 'Cannot change status from % to %', r.status, _status;
    END IF;
    UPDATE public.sample_requests SET status = 'cancelled', updated_at = now() WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'Sample request not found or access denied';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_sample_status(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_sample_status(uuid, text, text) TO authenticated;

-- Lists for the two dashboards. Neither returns any email.
CREATE OR REPLACE FUNCTION public.my_sample_requests()
RETURNS TABLE (id uuid, company_name text, country text, product text, quantity integer, message text,
               supplier_note text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT q.id, s.company_name, s.country, q.product, q.quantity, q.message, q.supplier_note, q.status, q.created_at
  FROM public.sample_requests q JOIN public.supplier_applications s ON s.id = q.supplier_application_id
  WHERE q.buyer_id = auth.uid() ORDER BY q.created_at DESC
$$;
CREATE OR REPLACE FUNCTION public.factory_sample_requests()
RETURNS TABLE (id uuid, product text, quantity integer, message text, supplier_note text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT q.id, q.product, q.quantity, q.message, q.supplier_note, q.status, q.created_at
  FROM public.sample_requests q WHERE public.is_factory_of(q.supplier_application_id) ORDER BY q.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.my_sample_requests() FROM anon, public;
REVOKE ALL ON FUNCTION public.factory_sample_requests() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_sample_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.factory_sample_requests() TO authenticated;
