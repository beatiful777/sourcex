create policy "Admins read all applications" on public.supplier_applications
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- A supplier's own quotes: product details without exposing the buyer's email.
create or replace function public.my_quotes()
returns table (
  id uuid,
  rfq_id uuid,
  product text,
  category text,
  country text,
  quantity text,
  rfq_status text,
  unit_price text,
  lead_time text,
  message text,
  applied_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select a.id, a.rfq_id, r.product, r.category, r.country, r.quantity, r.status,
         a.unit_price, a.lead_time, a.message, a.created_at
  from public.rfq_applications a
  join public.rfqs r on r.id = a.rfq_id
  where a.supplier_id = auth.uid()
  order by a.created_at desc
$$;

grant execute on function public.my_quotes() to authenticated;