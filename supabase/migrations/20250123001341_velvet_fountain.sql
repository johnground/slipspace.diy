/*
  # Fix user deletion cascade

  1. Changes
    - Update delete_user_profile function to properly handle foreign key constraints
    - Delete user_roles first, then profiles, then auth user
    - Add proper error handling and transaction management

  2. Security
    - Maintain admin-only access
    - Use security definer for proper permissions
*/

CREATE OR REPLACE FUNCTION delete_user_profile(target_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can delete user profiles';
  END IF;

  -- Delete in correct order to handle foreign key constraints
  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_profile(uuid) TO authenticated;
