begin;
-- Add a "partial" status: the data answered part of the question but not all of it.
alter table public.ask_data_log drop constraint ask_data_log_status_check;
alter table public.ask_data_log add constraint ask_data_log_status_check
 check (status in ('answered','partial','insufficient_data','refused','error'));
commit;
