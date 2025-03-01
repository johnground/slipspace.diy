/*
  # User Profile Deletion Functions and Policies
  
  1. Functions
    - delete_user_profile: Safely delete a user's profile and auth account
  
  2. Security
    - Admin-only profile deletion policy
    - Checks for admin privileges before deletion
*/

-- Function to safely delete a user's profile and auth account
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

  -- Check if this would delete the last admin
  IF (
    SELECT COUNT(*) = 1 
    FROM user_roles 
    WHERE role = 'admin'
    AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot delete the last admin user';
  END IF;

  -- Delete in correct order to handle foreign key constraints
  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM chat_messages WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_profile(uuid) TO authenticated;
