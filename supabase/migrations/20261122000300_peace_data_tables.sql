begin;
-- Peace agreements project data in SQL (hybrid: the CSVs stay as downloads and for notebooks).
-- Add-only: new tables, a view, a read-only role and one query function. No existing table changes.
-- Data is loaded by scripts/load_peace_data.mjs. No public access: RLS on, nothing granted to
-- anon or authenticated. The site's server reads it with the secret key; the AI reads it only
-- through query_peace_data(), which runs as the read-only role peace_reader.

create table public.pax_agreements (
 agt_id integer primary key,
 name text not null,
 signed_on date,
 year integer,
 country text,
 region text,
 process_id integer,
 process_name text,
 conflict_type text,            -- Government, Territory, Government/territory, Inter-group, Other
 agreement_level text,          -- Inter, InterIntra, Intra, IntraLocal
 stage text,                    -- Pre, SubPar, SubComp, Imp, Ren, Cea, Oth
 stage_label text,              -- readable stage: Pre-negotiation, Partial substantive, Comprehensive, Implementation, Renewal, Ceasefire, Other
 status text,
 pages integer,
 n_characters integer,
 parties text,
 third_parties text,
 country_iso3 text,
 country2_iso3 text,
 mentions_women boolean not null,  -- PA-X GeWom > 0: any provision on women, girls or gender
 gewom integer,
 un_signatory boolean,             -- ImUN
 other_intl_signatory boolean,     -- ImOth
 peacekeeping boolean,             -- ImPK
 ucdp_conflict text,
 pam_agreement text,
 raw jsonb not null                -- every PA-X v10 column as published
);
create index pax_agreements_year_idx on public.pax_agreements (year);
create index pax_agreements_stage_idx on public.pax_agreements (stage);
create index pax_agreements_region_idx on public.pax_agreements (region);
comment on table public.pax_agreements is 'PA-X Peace Agreements Database v10 (University of Edinburgh): 2,257 agreements 1990-2025. One row per agreement. mentions_women = any provision on women, girls or gender (GeWom > 0). raw holds all 279 original columns.';

create table public.padd_agreements (
 agt_id integer primary key references public.pax_agreements(agt_id),
 delegates integer,
 women_delegates integer,
 pct_women_delegates numeric,    -- 0-1
 signatories integer,
 women_signatories integer,
 pct_women_signatories numeric,  -- 0-1
 negotiators integer,
 women_negotiators integer,
 pct_women_negotiators numeric,  -- 0-1
 mediators integer,
 women_mediators integer,
 observers integer,
 women_observers integer,
 women_role_group text,          -- Woman signatory / Women present, none signed / No women named
 raw jsonb not null
);
comment on table public.padd_agreements is 'Peace Agreement Delegate Dataset 1.0 (Good, APSR 2025), agreement level: people named in 116 comprehensive agreements (1990-2020), counts by role and coded gender. Gender is assumed from names (Gender API + hand checks). Percentages are 0-1.';

create table public.padd_delegates (
 id integer primary key,
 agt_id integer references public.pax_agreements(agt_id),
 name text,
 position_simple text,           -- Sig, Neg, Ob, Med, Adv, Log, WomCom, Unknown
 position_label text,            -- signatory, negotiator, observer, mediator, adviser, support staff, women's committee, unknown
 position_detail text,
 title text,
 affiliation text,
 is_woman boolean                -- FemTrack1: true woman, false man, null unknown
);
create index padd_delegates_agt_idx on public.padd_delegates (agt_id);
comment on table public.padd_delegates is 'PADD delegate level: one row per person named in a comprehensive agreement, with role and assumed gender.';

create table public.cfr_processes (
 slug text primary key,
 url text not null,
 country text,
 agreement text,
 process_type text,
 negotiators_pct numeric,        -- 0-100
 mediators_pct numeric,
 signatories_pct numeric,
 parliament_year text,
 parliament_pct numeric,
 ref_women_girls_gender boolean, -- copied by CFR from PA-X; not independent of mentions_women
 ref_violence_against_women boolean,
 negotiating_parties text,
 third_parties text,
 list_page_negotiators numeric,
 pax_agt_id integer references public.pax_agreements(agt_id)  -- matched by hand; null for ongoing talks and one unmatched agreement
);
comment on table public.cfr_processes is 'CFR Women''s Participation in Peace Processes: 73 process pages read 22 Nov 2026. Percentages are 0-100. pax_agt_id links to pax_agreements (47 matched agreements; 3 CFR pages are duplicates of the same agreement).';

create view public.women_at_the_table with (security_invoker = true) as
select a.agt_id, a.name, a.year, a.country, a.region, a.stage_label, a.mentions_women, a.un_signatory,
       p.pct_women_delegates, p.pct_women_signatories, p.women_signatories, p.women_role_group,
       c.negotiators_pct as cfr_negotiators_pct, c.signatories_pct as cfr_signatories_pct, c.url as cfr_url
from public.pax_agreements a
left join public.padd_agreements p on p.agt_id = a.agt_id
left join lateral (select * from public.cfr_processes c where c.pax_agt_id = a.agt_id order by c.slug limit 1) c on true
where p.agt_id is not null or c.slug is not null;
comment on view public.women_at_the_table is 'Agreements with PADD and/or CFR data, joined: women among delegates/signatories (PADD, 0-1) and negotiators/signatories (CFR, 0-100).';

-- No public access.
alter table public.pax_agreements enable row level security;
alter table public.padd_agreements enable row level security;
alter table public.padd_delegates enable row level security;
alter table public.cfr_processes enable row level security;
revoke all on public.pax_agreements, public.padd_agreements, public.padd_delegates, public.cfr_processes, public.women_at_the_table from anon, authenticated;

-- Read-only role used by the AI's queries: SELECT on these tables only, nothing else.
create role peace_reader nologin noinherit;
grant usage on schema public to peace_reader;
grant select on public.pax_agreements, public.padd_agreements, public.padd_delegates, public.cfr_processes, public.women_at_the_table to peace_reader;
-- RLS applies to peace_reader too; let it read every row of these four tables.
create policy "peace_reader reads all" on public.pax_agreements for select to peace_reader using (true);
create policy "peace_reader reads all" on public.padd_agreements for select to peace_reader using (true);
create policy "peace_reader reads all" on public.padd_delegates for select to peace_reader using (true);
create policy "peace_reader reads all" on public.cfr_processes for select to peace_reader using (true);
grant peace_reader to postgres;  -- lets the migration hand the function to peace_reader

-- Runs one read-only SELECT and returns up to 200 rows as JSON. It executes as its owner,
-- peace_reader, so it can only read the tables above. Wrapping the query as a subquery blocks
-- INSERT/UPDATE/DELETE/DDL (they can't appear inside a subquery) and multiple statements.
create function public.query_peace_data(sql text)
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '5s'
as $$
declare
 cleaned text := regexp_replace(btrim(sql), ';\s*$', '');
 result jsonb;
begin
 if cleaned is null or cleaned = '' then raise exception 'Empty query.'; end if;
 if char_length(cleaned) > 4000 then raise exception 'Query is too long (4,000 characters max).'; end if;
 if cleaned !~* '^\s*(select|with)\s' then raise exception 'Only SELECT queries are allowed.'; end if;
 if position(';' in cleaned) > 0 then raise exception 'Only one statement is allowed.'; end if;
 execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from (%s) q limit 200) t', cleaned) into result;
 return result;
end;
$$;
-- Owning a function needs CREATE on the schema; grant it only for the hand-over, then take it back.
grant create on schema public to peace_reader;
alter function public.query_peace_data(text) owner to peace_reader;
revoke create on schema public from peace_reader;
revoke all on function public.query_peace_data(text) from public, anon, authenticated;
grant execute on function public.query_peace_data(text) to service_role;
comment on function public.query_peace_data(text) is 'Read-only SQL for the Ask-the-data AI: one SELECT over the peace tables, max 200 rows, 5 s timeout. Runs as peace_reader. Server-only (service_role).';
commit;
