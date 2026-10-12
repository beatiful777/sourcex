-- Admin roles (separate table, never on profiles)
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "Users read their own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and ur.role = _role
  )
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated, service_role;

-- Founding supplier applications
create table public.supplier_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  company_name text not null,
  contact_name text not null,
  business_email text not null,
  country text,
  city text,
  website_or_catalog text,
  categories text[] not null default '{}',
  min_order_quantity text,
  certifications text[] not null default '{}',
  factory_details text,
  status text not null default 'pending' check (status in ('pending','approved','rejected'))
);

grant select, insert, update on public.supplier_applications to authenticated;
grant insert, select on public.supplier_applications to anon;
grant all on public.supplier_applications to service_role;
alter table public.supplier_applications enable row level security;

create policy "Anyone can submit a supplier application" on public.supplier_applications
  for insert to anon, authenticated
  with check (status = 'pending' and (user_id is null or user_id = auth.uid()));

create policy "Approved factories are public" on public.supplier_applications
  for select to anon, authenticated
  using (status = 'approved');

create policy "Applicants read their own application" on public.supplier_applications
  for select to authenticated
  using (
    user_id = auth.uid()
    or lower(business_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Admins moderate applications" on public.supplier_applications
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index supplier_applications_status_idx on public.supplier_applications (status);

-- Waitlist had RLS enabled with no policies, so sign-ups silently failed
create policy "Anyone can join the waitlist" on public.waitlist
  for insert to anon, authenticated with check (true);
grant insert on public.waitlist to anon, authenticated;
grant select on public.waitlist to service_role;