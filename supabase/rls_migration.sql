-- ═══════════════════════════════════════════════════════════
--  UTenancy — RLS & Storage Security Migration
--  Run in Supabase SQL editor (Dashboard → SQL editor)
--  Safe to re-run: uses DROP IF EXISTS + CREATE
-- ═══════════════════════════════════════════════════════════


-- ── 1. PROFILES ─────────────────────────────────────────────
-- Add missing columns
alter table public.profiles add column if not exists email text;

-- Add DELETE policy (owner can remove their own row)
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);


-- ── 2. LISTINGS ─────────────────────────────────────────────
-- Expand status to include rented + archived
-- (drop the existing check constraint and recreate it)
alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status in ('active', 'draft', 'rented', 'archived'));


-- ── 3. CONVERSATION_PARTICIPANTS ────────────────────────────
-- Fix the SELECT policy: the original used a self-referencing subquery
-- on the same table without an alias, which can cause recursion.
-- Replace with an IN (...) subquery pattern which is unambiguous.
drop policy if exists "Participants can view participant rows"
  on public.conversation_participants;

create policy "Participants can view participant rows"
  on public.conversation_participants for select
  using (
    conversation_id in (
      select cp.conversation_id
      from   public.conversation_participants cp
      where  cp.user_id = auth.uid()
    )
  );


-- ── 4. LISTING-IMAGES STORAGE BUCKET ────────────────────────
-- Create the bucket (public reads) if it doesn't exist yet.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Public read (anyone can view listing photos — correct for a housing platform)
drop policy if exists "Public listing image read" on storage.objects;
create policy "Public listing image read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Landlords may upload images ONLY under a path they own.
-- Path format: {listing_id}/{timestamp}_{index}.{ext}
-- We verify that the first path segment (listing_id) belongs to the
-- authenticated user's landlord_id.
drop policy if exists "Landlords upload listing images" on storage.objects;
create policy "Landlords upload listing images"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from   public.listings l
      where  l.id::text = (storage.foldername(name))[1]
        and  l.landlord_id = auth.uid()
    )
  );

-- Landlords may update (replace) their own listing images
drop policy if exists "Landlords update listing images" on storage.objects;
create policy "Landlords update listing images"
  on storage.objects for update
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from   public.listings l
      where  l.id::text = (storage.foldername(name))[1]
        and  l.landlord_id = auth.uid()
    )
  );

-- Landlords may delete their own listing images.
-- This is needed for the "delete listing → clean up storage" flow.
drop policy if exists "Landlords delete listing images" on storage.objects;
create policy "Landlords delete listing images"
  on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from   public.listings l
      where  l.id::text = (storage.foldername(name))[1]
        and  l.landlord_id = auth.uid()
    )
  );


-- ── 5. LISTING_INTERESTS — visibility for all authenticated users ─────────
-- The original policies only let students see their OWN rows, which meant:
--   • interestCount was always 0 or 1 for students (not the true total)
--   • the "Interested Students" panel was empty for everyone but landlords
--   • Supabase Realtime postgres_changes only fired for the student's own row
--
-- This new policy lets any logged-in user see interests on ACTIVE listings,
-- which enables accurate counts, the live panel, and real-time subscriptions.
-- Private/draft listings are still hidden.

drop policy if exists "Authenticated users see interests on active listings"
  on public.listing_interests;

create policy "Authenticated users see interests on active listings"
  on public.listing_interests for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'active'
    )
  );

-- NOTE: Also enable Realtime for this table in the Supabase dashboard:
--   Database → Replication → listing_interests → toggle on
