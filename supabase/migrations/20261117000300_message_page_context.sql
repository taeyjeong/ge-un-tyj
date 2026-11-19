begin;
-- Existing messages have no reliable origin; leave them unassigned.
alter table public.community_messages add column page_path text
 check(page_path is null or (char_length(page_path)<=1000 and page_path like '/%' and page_path not like '//%'));
grant select(page_path) on public.community_messages to anon,authenticated;
-- Retain the four-argument function for clients on the previous deployment.
create function public.send_community_message(p_request_id uuid,p_guest_id uuid,p_display_name text,p_body text,p_page_path text)
returns table(id bigint,display_name text,body text,created_at timestamptz,page_path text)
language plpgsql security definer set search_path='' as $$
declare message_id bigint;
begin
 if p_page_path is null or char_length(p_page_path)>1000 or p_page_path not like '/%' or p_page_path like '//%'
 or p_page_path ~ '[\\#[:space:]]'
 or p_page_path !~ '^/[^?]*(\?index=(gii|hdi|gdi|ihdi|phdi|fdi|fcs|mpi|ghi|epi))?$'
 then raise exception 'Invalid message page.'; end if;
 select saved.id into message_id from public.send_community_message(p_request_id,p_guest_id,p_display_name,p_body) saved;
 update public.community_messages m set page_path=coalesce(m.page_path,p_page_path) where m.id=message_id;
 return query select m.id,m.display_name,m.body,m.created_at,m.page_path from public.community_messages m where m.id=message_id;
end;
$$;
revoke all on function public.send_community_message(uuid,uuid,text,text,text) from public;
grant execute on function public.send_community_message(uuid,uuid,text,text,text) to anon,authenticated;
commit;
