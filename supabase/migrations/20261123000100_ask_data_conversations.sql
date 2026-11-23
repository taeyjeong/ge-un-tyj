begin;
-- Group "Ask the data" questions into whole conversations so a conversation can be reopened from the
-- public history (/ask-history) with every question and answer in it.
--   conversation_id: random id made in the visitor's browser for one conversation (not the visitor id;
--                    a new conversation gets a new id).
--   continued_from:  the log row a conversation was continued from on /ask-history, so reopening a
--                    continued conversation also brings back the conversation it started from.
-- Older rows have neither and are treated as one-question conversations.
alter table public.ask_data_log
  add column conversation_id uuid,
  add column continued_from bigint references public.ask_data_log (id) on delete set null;
create index ask_data_log_conversation_idx on public.ask_data_log (conversation_id, id) where conversation_id is not null;
comment on column public.ask_data_log.conversation_id is 'Random id for one chat conversation, made in the browser. Groups follow-up questions.';
comment on column public.ask_data_log.continued_from is 'Log row this conversation was continued from on /ask-history.';
commit;
