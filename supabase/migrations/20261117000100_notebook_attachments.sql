begin;
alter table public.gender_equality_notes add column attachments jsonb not null default '[]'::jsonb
 check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 10);
alter table public.gender_equality_notes drop constraint gender_equality_notes_body_check;
alter table public.gender_equality_notes add constraint gender_equality_notes_body_check
 check (char_length(body) <= 4000 and (char_length(btrim(body)) > 0 or jsonb_array_length(attachments) > 0));
insert into storage.buckets (id,name,public,file_size_limit)
 values ('notebook-attachments','notebook-attachments',false,20971520);
create policy "Upload own notebook attachments" on storage.objects for insert to authenticated
 with check (bucket_id = 'notebook-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Read own notebook attachments" on storage.objects for select to authenticated
 using (bucket_id = 'notebook-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own notebook attachments" on storage.objects for delete to authenticated
 using (bucket_id = 'notebook-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
