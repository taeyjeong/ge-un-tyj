begin;
create table public.community_messages (
 id bigint generated always as identity primary key,
 request_id uuid not null unique,
 display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
 body text not null check (char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
alter table public.community_messages enable row level security;
create policy "Anyone can read public chat" on public.community_messages for select to anon,authenticated using (true);
revoke all on public.community_messages from anon,authenticated;
grant select(id,display_name,body,created_at) on public.community_messages to anon,authenticated;
create table public.community_message_limits (
 guest_id uuid primary key,
 last_sent_at timestamptz not null,
 sent_day date not null,
 day_count integer not null
);
alter table public.community_message_limits enable row level security;
revoke all on public.community_message_limits from anon,authenticated;
create function public.send_community_message(p_request_id uuid,p_guest_id uuid,p_display_name text,p_body text)
returns table(id bigint,display_name text,body text,created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
 last_send public.community_message_limits%rowtype;
 clean_name text := coalesce(nullif(btrim(p_display_name),''),'Guest');
begin
 if p_guest_id is null or p_request_id is null then raise exception 'Missing message identifier.'; end if;
 if p_body is null or char_length(btrim(p_body)) not between 1 and 2000 then raise exception 'Write a message of 1–2,000 characters.'; end if;
 if char_length(clean_name)>40 then raise exception 'Use a display name of 40 characters or fewer.'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_guest_id::text, 0));
 if exists(select 1 from public.community_messages m where m.request_id=p_request_id) then
  return query select m.id,m.display_name,m.body,m.created_at from public.community_messages m where m.request_id=p_request_id;
  return;
 end if;
 select * into last_send from public.community_message_limits l where l.guest_id=p_guest_id;
 if last_send.last_sent_at>now()-interval '5 seconds' then raise exception 'Please wait 5 seconds between messages.'; end if;
 if last_send.sent_day=current_date and last_send.day_count>=100 then raise exception 'You have reached 100 messages today. Please come back tomorrow.'; end if;
 insert into public.community_message_limits(guest_id,last_sent_at,sent_day,day_count)
 values(p_guest_id,now(),current_date,1)
 on conflict(guest_id) do update set last_sent_at=now(),sent_day=current_date,
 day_count=case when community_message_limits.sent_day=current_date then community_message_limits.day_count+1 else 1 end;
 return query insert into public.community_messages as m(request_id,display_name,body)
 values(p_request_id,clean_name,btrim(p_body)) returning m.id,m.display_name,m.body,m.created_at;
end;
$$;
revoke all on function public.send_community_message(uuid,uuid,text,text) from public;
grant execute on function public.send_community_message(uuid,uuid,text,text) to anon,authenticated;
comment on table public.community_messages is 'Public, shared chat. No private notebook content or attachments are copied here. Display names are unverified.';
commit;
