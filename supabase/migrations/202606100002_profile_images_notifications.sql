-- Neyrlo: profile settings, profile images, push tokens, and notification events.

alter table public.profiles
  add column if not exists notify_messages boolean not null default true,
  add column if not exists notify_requests boolean not null default true,
  add column if not exists notify_status_updates boolean not null default true,
  add column if not exists notify_return_reminders boolean not null default true;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  device_platform text,
  device_id text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);
create index if not exists push_tokens_enabled_idx on public.push_tokens (enabled);

alter table public.push_tokens enable row level security;

drop policy if exists "Users can read their own push tokens" on public.push_tokens;
create policy "Users can read their own push tokens"
  on public.push_tokens
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own push tokens" on public.push_tokens;
create policy "Users can insert their own push tokens"
  on public.push_tokens
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own push tokens" on public.push_tokens;
create policy "Users can update their own push tokens"
  on public.push_tokens
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own push tokens" on public.push_tokens;
create policy "Users can delete their own push tokens"
  on public.push_tokens
  for delete
  using (user_id = auth.uid());

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_events_type_chk check (type in ('message', 'request', 'request_accepted', 'request_declined', 'return_reminder'))
);

create index if not exists notification_events_user_created_idx on public.notification_events (user_id, created_at desc);
create index if not exists notification_events_unread_idx on public.notification_events (user_id) where read_at is null;

alter table public.notification_events enable row level security;

drop policy if exists "Users can read their own notification events" on public.notification_events;
create policy "Users can read their own notification events"
  on public.notification_events
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can update their own notification events" on public.notification_events;
create policy "Users can update their own notification events"
  on public.notification_events
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Authenticated users can create notification events" on public.notification_events;
create policy "Authenticated users can create notification events"
  on public.notification_events
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Profile images are publicly readable" on storage.objects;
create policy "Profile images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'profile-images');

drop policy if exists "Users can update their own profile images" on storage.objects;
create policy "Users can update their own profile images"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own profile images" on storage.objects;
create policy "Users can delete their own profile images"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
