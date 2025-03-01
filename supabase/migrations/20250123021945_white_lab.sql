-- Improve error handling in get_admin_status function
CREATE OR REPLACE FUNCTION get_admin_status()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return false if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Check admin status with better error handling
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false on any error
    RAISE WARNING 'Error checking admin status: %', SQLERRM;
    RETURN false;
END;
$$;

-- Improve error handling in get_api_key function
CREATE OR REPLACE FUNCTION get_api_key(service_name text)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  key_value text;
BEGIN
  -- Return null if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check admin status first
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get API key with better error handling
  SELECT api_key INTO key_value
  FROM api_keys
  WHERE service = service_name;

  RETURN key_value;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return null on any error
    RAISE WARNING 'Error getting API key: %', SQLERRM;
    RETURN NULL;
END;
$$;
