begin;
create table public.gender_equality_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  browser_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  kind text not null default 'note' check (kind in ('note', 'question')),
  page_path text not null default '/' check (char_length(page_path) <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, browser_id)
);
create index gender_equality_notes_owner_created_idx
  on public.gender_equality_notes (user_id, created_at desc, id desc);
alter table public.gender_equality_notes enable row level security;
create policy "Read own gender equality notes"
  on public.gender_equality_notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Insert own gender equality notes"
  on public.gender_equality_notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Delete own gender equality notes"
  on public.gender_equality_notes for delete to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.gender_equality_notes from anon, authenticated;
grant select, insert, delete on public.gender_equality_notes to authenticated;
comment on table public.gender_equality_notes is
  'Private questions and notes for gender-equality-un-data; each signed-in user can access only their own rows.';
commit;
