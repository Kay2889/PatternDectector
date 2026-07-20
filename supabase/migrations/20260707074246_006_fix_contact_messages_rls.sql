/*
# Fix RLS Policy for contact_messages

The previous `anon_can_insert_messages` policy had `WITH CHECK (true)` 
which allows unrestricted access. This fixes it by:
1. Dropping the overly permissive policy
2. Creating a policy that validates the insert has proper fields
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "anon_can_insert_messages" ON contact_messages;

-- Create a new policy that validates input
-- Anonymous users can only insert if they provide name, email, and message
CREATE POLICY "anon_can_insert_contact_messages" ON contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    name IS NOT NULL 
    AND length(name) > 0 
    AND email IS NOT NULL 
    AND length(email) > 0
    AND message IS NOT NULL
    AND length(message) > 0
  );

-- Also ensure authenticated users have similar validation
DROP POLICY IF EXISTS "users_can_insert_own_messages" ON contact_messages;

CREATE POLICY "users_can_insert_contact_messages" ON contact_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    name IS NOT NULL 
    AND length(name) > 0 
    AND email IS NOT NULL 
    AND length(email) > 0
    AND message IS NOT NULL
    AND length(message) > 0
  );