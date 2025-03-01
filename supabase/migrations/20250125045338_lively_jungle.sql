/*
  # Create initial admin user and role
  
  1. Changes
    - Create admin user in auth.users
    - Add admin role in user_roles
    - Use safe PL/pgSQL block with error handling
*/

DO $$ 
DECLARE
  admin_uid uuid := '7bbfe663-ca49-4f69-9d39-c35c63b69989';
BEGIN
  -- First create the admin user if it doesn't exist
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    admin_uid,
    'admin@slipspace.ai',
    crypt('admin', gen_salt('bf')),
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Then create the admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (admin_uid, 'admin')
  ON CONFLICT (user_id) DO NOTHING;

EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END $$;
