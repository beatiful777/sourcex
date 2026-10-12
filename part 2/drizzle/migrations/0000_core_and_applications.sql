CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  company_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  product text NOT NULL,
  category text NOT NULL,
  country text,
  quantity text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.rfqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert rfq" ON public.rfqs FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "user insert rfq" ON public.rfqs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user read own rfq" ON public.rfqs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user update own rfq" ON public.rfqs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user delete own rfq" ON public.rfqs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  country_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, country_code)
);
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (length(email) BETWEEN 3 AND 255);

-- Open RFQ board for suppliers: safe columns only (no buyer email)
CREATE OR REPLACE FUNCTION public.list_open_rfqs()
RETURNS TABLE (id uuid, product text, category text, country text, quantity text, details text, created_at timestamptz, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.product, r.category, r.country, r.quantity, r.details, r.created_at, (r.user_id = auth.uid())
  FROM public.rfqs r
  WHERE r.status = 'open' AND auth.uid() IS NOT NULL
  ORDER BY r.created_at DESC
$$;
REVOKE EXECUTE ON FUNCTION public.list_open_rfqs() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_open_rfqs() TO authenticated;

CREATE TABLE public.rfq_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL,
  supplier_email text NOT NULL,
  company_name text NOT NULL,
  unit_price text,
  lead_time text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, supplier_id)
);
GRANT SELECT, INSERT, DELETE ON public.rfq_applications TO authenticated;
GRANT ALL ON public.rfq_applications TO service_role;
ALTER TABLE public.rfq_applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_apply_to_rfq(_rfq uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.rfqs WHERE id = _rfq AND status = 'open' AND user_id IS DISTINCT FROM auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.owns_rfq(_rfq uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.rfqs WHERE id = _rfq AND user_id = auth.uid())
$$;

CREATE POLICY "supplier apply" ON public.rfq_applications FOR INSERT TO authenticated
  WITH CHECK (supplier_id = auth.uid() AND public.can_apply_to_rfq(rfq_id)
    AND length(message) BETWEEN 1 AND 2000 AND length(company_name) BETWEEN 1 AND 150);
CREATE POLICY "supplier reads own" ON public.rfq_applications FOR SELECT TO authenticated USING (supplier_id = auth.uid());
CREATE POLICY "buyer reads applications" ON public.rfq_applications FOR SELECT TO authenticated USING (public.owns_rfq(rfq_id));
CREATE POLICY "supplier withdraws" ON public.rfq_applications FOR DELETE TO authenticated USING (supplier_id = auth.uid());