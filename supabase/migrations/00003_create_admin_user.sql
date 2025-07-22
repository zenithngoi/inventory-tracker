-- Create a super admin user with access to all data
-- This file should be executed after the initial table setup

BEGIN;

-- Create admin user in auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e', -- fixed UUID for consistency
  'authenticated',
  'authenticated',
  'admin@inventorysystem.com',
  -- This creates a password hash for 'Admin@123456'
  crypt('Admin@123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "System Administrator", "phone": "+1234567890", "region_code": "+1", "isAdmin": true}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Grant admin access to all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Grant all privileges for the admin on all existing tables
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO "8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e"', r.tablename);
  END LOOP;
  
  -- Set up policies to allow the admin to read all user data
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL TO authenticated USING (auth.uid() = ''8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'') WITH CHECK (auth.uid() = ''8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'')', r.tablename);
  END LOOP;
END $$;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin',
      'false'
    )::boolean
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a view to see all user registrations
CREATE OR REPLACE VIEW public.user_registrations AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'region_code' as region_code,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'isAdmin' as is_admin
FROM auth.users;

-- Add policy to allow only admins to access the view
CREATE POLICY admin_view_users ON public.user_registrations 
  FOR SELECT TO authenticated 
  USING (
    is_admin() OR 
    auth.uid() = '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'
  );

-- Output for the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Created admin user: admin@inventorysystem.com with password: Admin@123456';
END $$;

COMMIT;