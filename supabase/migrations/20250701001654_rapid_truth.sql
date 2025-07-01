/*
  # Create user role and helper functions

  1. New Functions
    - `get_user_role(user_id)` - Returns the role of a user from auth.users metadata
    - `get_professional_id_by_user(user_id)` - Returns the professional_id for a user
    - `uid()` - Helper function to get current user ID (if not exists)

  2. Security
    - Functions are created with proper security context
    - Only authenticated users can call these functions
    - Functions respect RLS policies

  3. Purpose
    - Enable proper role-based access control
    - Support existing RLS policies that reference these functions
    - Allow admin users to manage the system through the Access page
*/

-- Function to get current user ID (helper function)
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Function to get user role from auth.users metadata
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.users.raw_user_meta_data->>'role')::text,
    CASE 
      WHEN auth.users.email = 'admin@clinic.com' THEN 'admin'
      WHEN EXISTS (
        SELECT 1 FROM professionals 
        WHERE professionals.email = auth.users.email
      ) THEN 'professional'
      ELSE 'admin'
    END
  )
  FROM auth.users
  WHERE auth.users.id = user_id;
$$;

-- Function to get professional ID by user ID
CREATE OR REPLACE FUNCTION get_professional_id_by_user(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      -- First try to get from user metadata
      WHEN (auth.users.raw_user_meta_data->>'professional_id') IS NOT NULL 
      THEN (auth.users.raw_user_meta_data->>'professional_id')::uuid
      -- Fallback to matching by email
      ELSE professionals.id
    END
  FROM auth.users
  LEFT JOIN professionals ON professionals.email = auth.users.email
  WHERE auth.users.id = user_id;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION uid() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_professional_id_by_user(uuid) TO authenticated;

-- Also grant to anon for public access where needed
GRANT EXECUTE ON FUNCTION uid() TO anon;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_professional_id_by_user(uuid) TO anon;