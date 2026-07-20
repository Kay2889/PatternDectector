/*
# Add admin read policies for user data export

## Purpose
The admin dashboard needs to export a database of all registered users and
their scan activity. Currently, RLS only lets each user read their own rows
in `profiles` and `scans`, so an admin (even with role = 'admin') cannot see
other users' data. This migration adds SELECT policies that allow users with
the 'admin' role to read all rows in `profiles` and `scans`.

## Changes
1. `profiles` — new SELECT policy `admin_select_all_profiles`
   - TO authenticated
   - USING: requester's profile.role = 'admin'
   - Coexists with the existing `select_own_profile` policy (OR semantics).

2. `scans` — new SELECT policy `admin_select_all_scans`
   - TO authenticated
   - USING: requester's profile.role = 'admin'
   - Coexists with the existing `select_own_scans` policy.

## Security
- Only authenticated users whose `profiles.role = 'admin'` gain access.
- No INSERT/UPDATE/DELETE changes — admins still cannot modify other users'
  profiles or scans; the existing owner-scoped policies remain in force.
- Uses `DROP POLICY IF EXISTS` for idempotency.
*/

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_select_all_scans" ON scans;
CREATE POLICY "admin_select_all_scans"
  ON scans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
