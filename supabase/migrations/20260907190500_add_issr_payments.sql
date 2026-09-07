create table if not exists public.issr_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_month date not null,
  received_amount numeric(10,2) not null default 0 check (received_amount >= 0),
  note text,
  source_document_id uuid references public.issr_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, payment_month)
);

create index if not exists issr_payments_user_id_idx on public.issr_payments(user_id);
create index if not exists issr_payments_user_month_idx on public.issr_payments(user_id, payment_month desc);
create index if not exists issr_payments_source_document_id_idx on public.issr_payments(source_document_id);

alter table public.issr_payments enable row level security;
revoke all on table public.issr_payments from anon, authenticated;
grant select, insert, update, delete on table public.issr_payments to authenticated;

create policy "Users can view own payments" on public.issr_payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create own payments" on public.issr_payments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own payments" on public.issr_payments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own payments" on public.issr_payments for delete to authenticated using ((select auth.uid()) = user_id);
