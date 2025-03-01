/*
  # OpenAI API Key Management

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `service` (text, e.g., 'openai')
      - `api_key` (text, encrypted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policies for admin access only
    - Create secure functions for key management
*/

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(service)
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (check_is_admin())
  WITH CHECK (check_is_admin());

-- Function to securely get API key
CREATE OR REPLACE FUNCTION get_api_key(service_name text)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  key_value text;
BEGIN
  -- Only admins can access API keys
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT api_key INTO key_value
  FROM api_keys
  WHERE service = service_name;

  RETURN key_value;
END;
$$;

-- Function to securely set API key
CREATE OR REPLACE FUNCTION set_api_key(service_name text, key_value text)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only admins can set API keys
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  INSERT INTO api_keys (service, api_key, created_by)
  VALUES (service_name, key_value, auth.uid())
  ON CONFLICT (service) 
  DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_api_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_api_key(text, text) TO authenticated;
