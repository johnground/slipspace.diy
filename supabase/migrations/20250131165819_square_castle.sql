-- First drop all dependent policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Now we can safely drop and recreate functions
DROP FUNCTION IF EXISTS get_admin_status() CASCADE;
DROP FUNCTION IF EXISTS get_user_profiles() CASCADE;

-- Create get_admin_status with better error handling
CREATE OR REPLACE FUNCTION get_admin_status()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the current user's ID
  user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- Create get_user_profiles with better error handling
CREATE OR REPLACE FUNCTION get_user_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  is_admin boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check admin status
  SELECT get_admin_status() INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    (u.raw_user_meta_data->>'email')::text as email,
    p.created_at,
    EXISTS (
      SELECT 1 
      FROM user_roles ur 
      WHERE ur.user_id = p.id 
      AND ur.role = 'admin'
    ) as is_admin
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Recreate the policy
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (get_admin_status());

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION get_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profiles() TO authenticated;
