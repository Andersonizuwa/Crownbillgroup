-- Add business eligibility fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_business boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS business_industry text,
ADD COLUMN IF NOT EXISTS business_tax_id text;

-- Add admin notes and review fields to grant_applications
ALTER TABLE public.grant_applications
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Drop and recreate policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (is_admin());