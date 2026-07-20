/*
# Admin and Contact System

1. Updates to profiles table
- Add role field (user, admin)
- Set specific admin email as admin role

2. Contact Messages table
- Store messages from contact form
- Track read status

3. Security
- RLS enabled on contact_messages
- Only admin can view all messages
- Users can insert their own messages
*/

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_messages
CREATE POLICY "users_can_insert_own_messages" ON contact_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "anon_can_insert_messages" ON contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "admin_can_read_all_messages" ON contact_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_can_update_messages" ON contact_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Set the admin user role
-- This will be applied when the specific admin email registers
-- For now, we handle this in the app logic