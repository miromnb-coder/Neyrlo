-- Neyrlo: expanded loan lifecycle statuses and notification event send tracking.

alter type public.request_status add value if not exists 'pickup_scheduled';
alter type public.request_status add value if not exists 'picked_up';
alter type public.request_status add value if not exists 'return_due';
alter type public.request_status add value if not exists 'returned';

alter table public.notification_events
  add column if not exists sent_at timestamptz,
  add column if not exists send_error text;

do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_constraint c
  join pg_class t on c.conrelid = t.oid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'notification_events'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%type%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.notification_events drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.notification_events
  add constraint notification_events_type_chk
  check (type in ('message', 'request', 'request_accepted', 'request_declined', 'request_cancelled', 'request_completed', 'pickup_scheduled', 'picked_up', 'return_due', 'returned', 'return_reminder'));

create index if not exists notification_events_pending_send_idx
  on public.notification_events (created_at)
  where sent_at is null and send_error is null;
