alter table public.issr_payments add column if not exists entitlement_month date;

update public.issr_payments
set entitlement_month = payment_month
where entitlement_month is null;

alter table public.issr_payments alter column entitlement_month set not null;

alter table public.issr_payments drop constraint if exists issr_payments_user_id_payment_month_key;

drop index if exists public.issr_payments_user_month_idx;
create index if not exists issr_payments_user_entitlement_idx on public.issr_payments(user_id, entitlement_month desc);
create index if not exists issr_payments_user_payment_month_idx on public.issr_payments(user_id, payment_month desc);
create unique index if not exists issr_payments_user_payment_entitlement_uidx on public.issr_payments(user_id, payment_month, entitlement_month);
