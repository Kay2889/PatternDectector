/*
# Add phone number support to profiles table

## Purpose
Phone-based authentication (SMS OTP) is enabled in the frontend UI, but the
`profiles` table has no column to store a phone number. Phone-only users
(those who sign up via SMS without an email) need their phone number persisted
so the app can display and manage it.

## Changes
1. New column: `profiles.phone`
   - Type: text, nullable
   - Stored formatted with country code (e.g., +1234567890)
   - Uniqueness is NOT enforced here because some users may share a phone
     for contact purposes; Supabase Auth itself enforces uniqueness on
     `auth.users.phone`.

2. No existing data is modified or deleted.

## Security
- RLS remains enabled on `profiles` (no change).
- Existing policies already scope access to the owning user via `auth.uid() = id`.
- No new policies needed — the new column is covered by existing per-row policies.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text;
