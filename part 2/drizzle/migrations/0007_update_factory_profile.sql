-- 0007: a factory edits its own profile after applying. Description, minimum order, certifications and website
-- change freely. Changing the company name, country or categories sends an approved profile back to 'pending'.
-- Idempotent. Applicants still cannot UPDATE supplier_applications directly (only admins can, by policy).

CREATE OR REPLACE FUNCTION public.my_factory_profile()
RETURNS TABLE (id uuid, company_name text, country text, categories text[], factory_details text,
               min_order_quantity text, certifications text[], website_or_catalog text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT s.id, s.company_name, s.country, s.categories, s.factory_details, s.min_order_quantity,
         s.certifications, s.website_or_catalog, s.status
  FROM public.supplier_applications s
  WHERE auth.uid() IS NOT NULL
    AND (s.user_id = auth.uid() OR lower(s.business_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY (s.status = 'approved') DESC, s.created_at DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.my_factory_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_factory_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_factory_profile(
  _id uuid, _company_name text, _country text, _categories text[], _factory_details text,
  _min_order_quantity text, _certifications text[], _website text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s public.supplier_applications; _name text := btrim(coalesce(_company_name, '')); _country_n text := nullif(btrim(coalesce(_country, '')), '');
  _cats text[]; _certs text[]; _web text := nullif(btrim(coalesce(_website, '')), ''); _moq text := nullif(btrim(coalesce(_min_order_quantity, '')), '');
  _det text := btrim(coalesce(_factory_details, '')); key_changed boolean; new_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO s FROM public.supplier_applications WHERE id = _id
    AND (user_id = auth.uid() OR lower(business_email) = lower(coalesce(auth.jwt() ->> 'email', ''))) FOR UPDATE;
  IF s.id IS NULL THEN RAISE EXCEPTION 'Profile not found or access denied'; END IF;
  IF s.status = 'rejected' THEN RAISE EXCEPTION 'This application was rejected and cannot be edited'; END IF;

  SELECT coalesce(array_agg(DISTINCT c ORDER BY c), '{}') INTO _cats FROM (SELECT btrim(x) AS c FROM unnest(coalesce(_categories, '{}')) x) q WHERE c <> '';
  SELECT coalesce(array_agg(DISTINCT c ORDER BY c), '{}') INTO _certs FROM (SELECT btrim(x) AS c FROM unnest(coalesce(_certifications, '{}')) x) q WHERE c <> '';

  IF length(_name) < 2 OR length(_name) > 120 THEN RAISE EXCEPTION 'Company name must be 2-120 characters'; END IF;
  IF _country_n IS NULL OR length(_country_n) > 80 THEN RAISE EXCEPTION 'Country is required'; END IF;
  IF cardinality(_cats) < 1 OR cardinality(_cats) > 10 OR EXISTS (SELECT 1 FROM unnest(_cats) c WHERE length(c) > 60) THEN
    RAISE EXCEPTION 'Pick 1-10 categories';
  END IF;
  IF length(_det) < 20 OR length(_det) > 2000 THEN RAISE EXCEPTION 'Description must be 20-2000 characters'; END IF;
  IF _moq IS NOT NULL AND length(_moq) > 60 THEN RAISE EXCEPTION 'Minimum order is too long'; END IF;
  IF cardinality(_certs) > 20 OR EXISTS (SELECT 1 FROM unnest(_certs) c WHERE length(c) > 60) THEN RAISE EXCEPTION 'Too many or too long certifications'; END IF;
  IF _web IS NOT NULL AND (length(_web) > 255 OR _web !~* '^https?://[^\s]+$') THEN RAISE EXCEPTION 'Website must start with http:// or https://'; END IF;

  key_changed := lower(_name) IS DISTINCT FROM lower(btrim(s.company_name))
    OR _country_n IS DISTINCT FROM s.country
    OR _cats IS DISTINCT FROM (SELECT coalesce(array_agg(DISTINCT btrim(x) ORDER BY btrim(x)), '{}') FROM unnest(coalesce(s.categories, '{}')) x WHERE btrim(x) <> '');
  new_status := CASE WHEN key_changed AND s.status = 'approved' THEN 'pending' ELSE s.status END;

  UPDATE public.supplier_applications SET company_name = _name, country = _country_n, categories = _cats,
    factory_details = _det, min_order_quantity = _moq, certifications = _certs, website_or_catalog = _web, status = new_status
  WHERE id = s.id;
  RETURN new_status;
END $$;
REVOKE ALL ON FUNCTION public.update_factory_profile(uuid, text, text, text[], text, text, text[], text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_factory_profile(uuid, text, text, text[], text, text, text[], text) TO authenticated;
