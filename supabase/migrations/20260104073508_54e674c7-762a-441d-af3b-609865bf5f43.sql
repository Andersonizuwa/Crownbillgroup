-- Create grant_applications table
CREATE TABLE public.grant_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    grant_type TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    organization_type TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    project_description TEXT NOT NULL,
    requested_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own grant applications"
ON public.grant_applications
FOR SELECT
USING ((user_id = auth.uid()) OR is_admin());

-- Users can insert their own applications
CREATE POLICY "Users can insert own grant applications"
ON public.grant_applications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update applications
CREATE POLICY "Admins can update grant applications"
ON public.grant_applications
FOR UPDATE
USING (is_admin());

-- Admins can delete applications
CREATE POLICY "Admins can delete grant applications"
ON public.grant_applications
FOR DELETE
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_grant_applications_updated_at
BEFORE UPDATE ON public.grant_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();