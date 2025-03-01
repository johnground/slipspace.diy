-- First drop all dependent policies
DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Now we can safely drop and recreate functions
DROP FUNCTION IF EXISTS check_is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_admin_status() CASCADE;
DROP FUNCTION IF EXISTS get_user_profiles() CASCADE;
DROP FUNCTION IF EXISTS delete_user_profile(uuid) CASCADE;

-- Recreate base admin check function
CREATE FUNCTION check_is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) INTO is_admin;
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Create admin status function
CREATE FUNCTION get_admin_status()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN check_is_admin();
END;
$$;

-- Create user profiles function
CREATE FUNCTION get_user_profiles()
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
BEGIN
  IF NOT check_is_admin() THEN
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

-- Create user deletion function
CREATE FUNCTION delete_user_profile(target_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can delete user profiles';
  END IF;

  IF (
    SELECT COUNT(*) = 1 
    FROM user_roles 
    WHERE role = 'admin'
    AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot delete the last admin user';
  END IF;

  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Recreate policies
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR check_is_admin());

CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (check_is_admin());

CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (check_is_admin())
  WITH CHECK (check_is_admin());

CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (check_is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_profile(uuid) TO authenticated;
