/*
  # Add role assignment function
  
  1. Changes
    - Create a function to safely assign roles to users
    - Function will check if user exists before assigning role
*/

-- Function to safely assign a role to a user
CREATE OR REPLACE FUNCTION assign_user_role(target_user_id uuid, role_name text)
RETURNS void AS $$
BEGIN
  -- Only proceed if the user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, role_name)
    ON CONFLICT (user_id) DO UPDATE
    SET role = role_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
