-- Function to safely delete a user's profile and auth account
CREATE OR REPLACE FUNCTION delete_user_profile(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can delete user profiles';
  END IF;

  -- Delete from user_roles first
  DELETE FROM user_roles WHERE user_id = target_user_id;

  -- Delete profile (due to foreign key constraint)
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policy for profile deletion
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
