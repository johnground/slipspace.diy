/*
  # Create function to get user profiles with emails

  This migration adds a secure function to fetch user profiles with their associated emails,
  only accessible to admin users.

  1. New Function
    - `get_user_profiles`: Returns user profiles with emails for admin users
  
  2. Security
    - Function is SECURITY DEFINER to access auth.users
    - Only accessible to authenticated users with admin role
*/

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
  -- Check if user is admin
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profiles() TO authenticated;
