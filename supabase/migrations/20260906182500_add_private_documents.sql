create table if not exists public.issr_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid null references public.issr_missions(id) on delete set null,
  title text not null,
  category text not null default 'other' check (category in ('arrete','attestation','emploi_du_temps','fiche_paie','justificatif','other')),
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

alter table public.issr_documents enable row level security;
grant select, insert, update, delete on public.issr_documents to authenticated;

create policy "Users can read own ISSR documents" on public.issr_documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own ISSR documents" on public.issr_documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own ISSR documents" on public.issr_documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own ISSR documents" on public.issr_documents for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('issr-documents','issr-documents',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']::text[])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Users can read own ISSR document files" on storage.objects for select to authenticated using (bucket_id='issr-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can upload own ISSR document files" on storage.objects for insert to authenticated with check (bucket_id='issr-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can update own ISSR document files" on storage.objects for update to authenticated using (bucket_id='issr-documents' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='issr-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can delete own ISSR document files" on storage.objects for delete to authenticated using (bucket_id='issr-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
