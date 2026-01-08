-- Create table for copy trade attempts to notify admin
CREATE TABLE public.copy_trade_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    trader_name TEXT NOT NULL,
    asset_symbol TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
    action_type TEXT NOT NULL CHECK (action_type IN ('copy_trade', 'apply_strategy')),
    profit_percentage NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copy_trade_attempts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own attempts
CREATE POLICY "Users can insert own copy trade attempts"
ON public.copy_trade_attempts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can view their own attempts, admins can view all
CREATE POLICY "Users can view own attempts admins can view all"
ON public.copy_trade_attempts
FOR SELECT
USING (user_id = auth.uid() OR is_admin());

-- Admins can delete attempts
CREATE POLICY "Admins can delete attempts"
ON public.copy_trade_attempts
FOR DELETE
USING (is_admin());