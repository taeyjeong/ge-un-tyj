begin;
-- Log of "Ask the data" questions and answers (the AI chat tab). Written only by the server
-- (/api/ask) with the project's secret key, which bypasses RLS. Visitors can neither read nor
-- write it: RLS is on and no privileges are granted to anon or authenticated.
create table public.ask_data_log (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now(),
 visitor_id uuid,                                   -- random id kept in the visitor's browser; not linked to any account
 page_path text check (page_path is null or char_length(page_path) <= 1000),
 question text not null check (char_length(question) between 1 and 2000),
 answer text check (answer is null or char_length(answer) <= 20000),
 status text not null check (status in ('answered','insufficient_data','refused','error')),
 tools_used text[] not null default '{}',
 data_gap jsonb,                                    -- set when the data couldn't answer: what was missing and which sources could fill it
 model text,
 duration_ms integer,
 input_tokens integer,
 output_tokens integer,
 error text check (error is null or char_length(error) <= 500)
);
create index ask_data_log_created_at_idx on public.ask_data_log (created_at desc);
create index ask_data_log_status_idx on public.ask_data_log (status, created_at desc);
alter table public.ask_data_log enable row level security;
revoke all on public.ask_data_log from anon, authenticated;
comment on table public.ask_data_log is 'Questions asked in the site''s "Ask the data" chat, with the AI answer, tools used and any data gap. Server-written only; no public access.';
commit;
