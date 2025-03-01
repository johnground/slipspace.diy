/*
  # Fix user_roles policies with security definer function
  
  1. Changes
    - Create a security definer function to check admin status
    - Simplify policies to use the function
    - Remove recursive policy checks
  
  2. Security
    - Maintain security through security definer function
    - Keep row-level security enabled
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can create roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) INTO _is_admin;
  
  RETURN _is_admin;
END;
$$;

-- Create simplified policies using the security definer function
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR check_is_admin()
  );

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
