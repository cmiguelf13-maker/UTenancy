-- ═══════════════════════════════════════════════════════════
--  UTenancy — Full Database Schema
--  Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- ═══════════════════════════════════════════════════════════

-- ── PROFILES ─────────────────────────────────────────────
-- One row per auth user, created automatically on signup.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'student' check (role in ('student', 'landlord')),
  first_name   text,
  last_name    text,
  university   text,
  major        text,
  grad_year    text,
  bio          text,
  avatar_url   text,
  sleep_time   text,
  cleanliness  text,
  noise        text,
  guests       text,
  smoking      boolean not null default false,
  pets         boolean not null default false,
  studying     text,
  phone        text,
  company      text,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly viewable"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, first_name, last_name, university, company, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── LISTINGS ─────────────────────────────────────────────
-- Created by landlords; each row is a property.
create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  landlord_id  uuid not null references auth.users(id) on delete cascade,
  address      text not null,
  unit         text,
  city         text not null,
  state        text not null default 'CA',
  zip          text,
  bedrooms     int not null default 1,
  bathrooms    numeric not null default 1,
  rent         int not null,
  type         text not null check (type in ('open-room', 'group-formation')),
  status       text not null default 'draft'
               check (status in ('active', 'pending', 'filled', 'draft')),
  description  text,
  amenities    text[] not null default '{}',
  images       text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.listings enable row level security;

-- Active listings are public; landlords always see their own
create policy "Anyone can view active listings"
  on public.listings for select
  using (status = 'active' or landlord_id = auth.uid());

create policy "Landlords can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own listings"
  on public.listings for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own listings"
  on public.listings for delete
  using (auth.uid() = landlord_id);


-- ── LISTING INTERESTS ────────────────────────────────────
-- Students express interest in a listing (one per student per listing).
create table if not exists public.listing_interests (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  student_id  uuid not null references auth.users(id) on delete cascade,
  message     text,
  created_at  timestamptz not null default now(),
  unique (listing_id, student_id)
);

alter table public.listing_interests enable row level security;

-- Landlords see who's interested in their own listings
create policy "Landlords see interests on their listings"
  on public.listing_interests for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.landlord_id = auth.uid()
    )
  );

-- Students see their own interests
create policy "Students see their own interests"
  on public.listing_interests for select
  using (student_id = auth.uid());

create policy "Students can express interest"
  on public.listing_interests for insert
  with check (auth.uid() = student_id);

create policy "Students can remove their interest"
  on public.listing_interests for delete
  using (auth.uid() = student_id);


-- ── CONVERSATIONS ─────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.listings(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.role() = 'authenticated');

create policy "Participants can view participant rows"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "Users can join conversations"
  on public.conversation_participants for insert
  with check (auth.uid() = user_id);


-- ── MESSAGES ─────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references auth.users(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);

alter table public.messages enable row level security;

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "Sender can mark messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );


-- ── WAITLIST ──────────────────────────────────────────────
-- Stores email sign-ups from the home page waitlist section.
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  type       text not null default 'student' check (type in ('student', 'landlord')),
  created_at timestamptz not null default now(),
  unique (email)
);

alter table public.waitlist enable row level security;

-- Only service role can read/delete waitlist entries (for newsletters)
create policy "Service role manages waitlist"
  on public.waitlist for all
  using (auth.role() = 'service_role');

-- Anyone can insert their email into the waitlist
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);


-- ── STORAGE: avatars bucket ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow anyone to read avatars (public bucket)
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
create policy "Users upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
