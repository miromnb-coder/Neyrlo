-- Neyrlo MVP database schema
-- Run this in Supabase SQL editor or through the Supabase CLI later.

create extension if not exists postgis with schema extensions;

create type public.item_mode as enum ('borrow', 'rent', 'swap', 'free');
create type public.item_status as enum ('draft', 'available', 'paused', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  neighborhood text,
  rating numeric(2, 1) default 0,
  successful_exchanges integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  mode public.item_mode not null,
  status public.item_status not null default 'available',
  price_cents integer,
  currency text default 'EUR',
  approximate_address text,
  location geography(point, 4326),
  available_from date,
  available_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index items_owner_id_idx on public.items(owner_id);
create index items_status_idx on public.items(status);
create index items_location_idx on public.items using gist(location);

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Available items are viewable by everyone"
  on public.items for select
  using (status = 'available' or auth.uid() = owner_id);

create policy "Users can create their own items"
  on public.items for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own items"
  on public.items for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Item images are viewable for visible items"
  on public.item_images for select
  using (
    exists (
      select 1
      from public.items
      where items.id = item_images.item_id
        and (items.status = 'available' or items.owner_id = auth.uid())
    )
  );

create policy "Users can add images to their own items"
  on public.item_images for insert
  with check (
    exists (
      select 1
      from public.items
      where items.id = item_images.item_id
        and items.owner_id = auth.uid()
    )
  );
