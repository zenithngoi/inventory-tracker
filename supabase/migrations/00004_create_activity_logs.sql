-- Create activity logs table and related functions
-- This tracks all inventory-related actions with full user history

BEGIN;

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  user_email TEXT,
  user_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  item_id UUID,
  item_name TEXT,
  item_barcode TEXT,
  location_id UUID,
  location_name TEXT,
  category_id UUID,
  category_name TEXT,
  quantity_before NUMERIC,
  quantity_after NUMERIC,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_item_id ON public.activity_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_location_id ON public.activity_logs(location_id);

-- RLS policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own logs
CREATE POLICY "Users can insert their own logs" 
  ON public.activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update logs
CREATE POLICY "Only admins can update logs" 
  ON public.activity_logs FOR UPDATE
  USING (is_admin());

-- Only admins can delete logs
CREATE POLICY "Only admins can delete logs" 
  ON public.activity_logs FOR DELETE
  USING (is_admin());

-- Users can view their own logs, admins can view all logs
CREATE POLICY "Users can view own logs, admins view all" 
  ON public.activity_logs FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_admin()
  );

-- Create a function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  action TEXT,
  item_id UUID DEFAULT NULL,
  item_name TEXT DEFAULT NULL,
  item_barcode TEXT DEFAULT NULL,
  location_id UUID DEFAULT NULL,
  location_name TEXT DEFAULT NULL,
  category_id UUID DEFAULT NULL,
  category_name TEXT DEFAULT NULL,
  quantity_before NUMERIC DEFAULT NULL,
  quantity_after NUMERIC DEFAULT NULL,
  details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get user email and name
  SELECT
    au.email,
    (au.raw_user_meta_data->>'full_name')
  INTO
    user_email,
    user_name
  FROM auth.users au
  WHERE au.id = auth.uid();

  -- Insert the log
  INSERT INTO public.activity_logs (
    id,
    user_id,
    user_email,
    user_name,
    action,
    item_id,
    item_name,
    item_barcode,
    location_id,
    location_name,
    category_id,
    category_name,
    quantity_before,
    quantity_after,
    details
  ) VALUES (
    gen_random_uuid(),
    auth.uid(),
    user_email,
    user_name,
    action,
    item_id,
    item_name,
    item_barcode,
    location_id,
    location_name,
    category_id,
    category_name,
    quantity_before,
    quantity_after,
    details
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easier item history queries
CREATE OR REPLACE VIEW public.item_history AS
SELECT *
FROM public.activity_logs
WHERE item_id IS NOT NULL
ORDER BY timestamp DESC;

-- Create a function to get item history
CREATE OR REPLACE FUNCTION public.get_item_history(item_id_param UUID)
RETURNS SETOF public.activity_logs AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.activity_logs
  WHERE item_id = item_id_param
  ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Migration completion notice
DO $$
BEGIN
  RAISE NOTICE 'Activity logging system created successfully';
END $$;

COMMIT;