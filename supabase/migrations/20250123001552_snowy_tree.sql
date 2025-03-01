/*
  # Fix admin status checking and profile loading

  1. Changes
    - Update check_is_admin function to handle no rows case
    - Add function to safely check admin status
    - Update get_user_profiles to use new admin check

  2. Security
    - Maintain security definer context
    - Add proper error handling
*/

-- Function to safely check admin status
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- Function to safely get admin status
CREATE OR REPLACE FUNCTION get_admin_status()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN check_is_admin();
END;
$$;

-- Update get_user_profiles to use new admin check
CREATE OR REPLACE FUNCTION get_user_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    (u.raw_user_meta_data->>'email')::text as email,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profiles() TO authenticated;
