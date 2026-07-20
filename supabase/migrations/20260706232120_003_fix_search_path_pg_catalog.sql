/*
# Fix search_path for update_updated_at function to include pg_catalog

1. Changes
- Set search_path to 'pg_catalog' so the function can access built-in functions like now()
- Keep the function secure by limiting search_path to only pg_catalog
- SECURITY DEFINER is needed because triggers execute with the function owner's privileges

2. Security
- Prevents search_path hijacking attacks
- Allows the function to work properly by giving it access to pg_catalog built-in functions
*/

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'pg_catalog'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
