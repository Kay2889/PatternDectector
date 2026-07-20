/*
# Fix search_path security issue for update_updated_at function

1. Changes
- Add `SET search_path = ''` to the update_updated_at function to prevent search_path manipulation attacks
- This is a security best practice for PostgreSQL functions to prevent attackers from hijacking function behavior by manipulating the search_path

2. Security
- Fixes the "Function Search Path Mutable" vulnerability
- Makes the function immutable regarding search_path, preventing privilege escalation attacks
*/

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
