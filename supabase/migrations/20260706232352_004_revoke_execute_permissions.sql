/*
# Fix SECURITY DEFINER function execution permissions

1. Security Issues Fixed
- Revoke EXECUTE privilege from PUBLIC on update_updated_at function
- This prevents anon and authenticated roles from calling the function directly via REST API
- The function should only be callable by triggers, not directly by users

2. Changes
- REVOKE EXECUTE FROM PUBLIC on public.update_updated_at
- The trigger will still work because it executes with the table owner's privileges
- This closes the security vulnerability of allowing any user to execute a SECURITY DEFINER function

3. Security
- SECURITY DEFINER is still needed for triggers to work properly
- By revoking PUBLIC execute, only the function owner (postgres) and triggers can call it
- This aligns with PostgreSQL security best practices for trigger functions
*/

REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM authenticated;
