-- Neyrlo: availability windows and request date ranges
-- Run this in Supabase SQL editor or via Supabase migrations before using the date picker in the app.

alter table public.listing_requests
  add column if not exists request_start_date date,
  add column if not exists request_end_date date,
  add column if not exists return_due_date date;

do $$
begin
  alter table public.listing_requests
    add constraint listing_requests_request_dates_order_chk
    check (
      request_start_date is null
      or request_end_date is null
      or request_start_date <= request_end_date
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.listing_requests
    add constraint listing_requests_return_due_date_chk
    check (
      return_due_date is null
      or request_start_date is null
      or request_start_date <= return_due_date
    );
exception
  when duplicate_object then null;
end $$;

create index if not exists listing_requests_listing_dates_idx
  on public.listing_requests (listing_id, request_start_date, request_end_date)
  where request_start_date is not null and request_end_date is not null;

create table if not exists public.listing_availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'available',
  note text,
  created_at timestamptz not null default now(),
  constraint listing_availability_dates_order_chk check (start_date <= end_date),
  constraint listing_availability_status_chk check (status in ('available', 'blocked'))
);

create index if not exists listing_availability_listing_dates_idx
  on public.listing_availability (listing_id, start_date, end_date);

create index if not exists listing_availability_owner_idx
  on public.listing_availability (owner_id);

alter table public.listing_availability enable row level security;

drop policy if exists "Listing availability is readable for visible listings" on public.listing_availability;
create policy "Listing availability is readable for visible listings"
  on public.listing_availability
  for select
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_availability.listing_id
        and (
          listings.status = 'active'
          or listings.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Listing owners can insert availability" on public.listing_availability;
create policy "Listing owners can insert availability"
  on public.listing_availability
  for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.listings
      where listings.id = listing_availability.listing_id
        and listings.owner_id = auth.uid()
    )
  );

drop policy if exists "Listing owners can update availability" on public.listing_availability;
create policy "Listing owners can update availability"
  on public.listing_availability
  for update
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.listings
      where listings.id = listing_availability.listing_id
        and listings.owner_id = auth.uid()
    )
  );

drop policy if exists "Listing owners can delete availability" on public.listing_availability;
create policy "Listing owners can delete availability"
  on public.listing_availability
  for delete
  using (owner_id = auth.uid());
