-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
ALTER DATABASE postgres SET "app.jwt_exp" TO '3600';

-- Create tables
BEGIN;

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  type TEXT NOT NULL CHECK (type IN ('warehouse', 'store', 'supplier', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create inventory items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  location_id UUID REFERENCES public.locations(id) NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL,
  unit_price DECIMAL(10, 2),
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_location_id UUID REFERENCES public.locations(id) NOT NULL,
  destination_location_id UUID REFERENCES public.locations(id) NOT NULL,
  requested_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  approved_by_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS inventory_items_barcode_idx ON public.inventory_items(barcode);
CREATE INDEX IF NOT EXISTS inventory_items_category_id_idx ON public.inventory_items(category_id);
CREATE INDEX IF NOT EXISTS inventory_items_location_id_idx ON public.inventory_items(location_id);
CREATE INDEX IF NOT EXISTS inventory_items_status_idx ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS transfers_status_idx ON public.transfers(status);
CREATE INDEX IF NOT EXISTS transfers_requested_by_user_id_idx ON public.transfers(requested_by_user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Allow authenticated users to read categories" 
ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert categories" 
ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories" 
ON public.categories FOR UPDATE TO authenticated USING (true);

-- Locations policies
CREATE POLICY "Allow authenticated users to read locations" 
ON public.locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert locations" 
ON public.locations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update locations" 
ON public.locations FOR UPDATE TO authenticated USING (true);

-- Inventory items policies
CREATE POLICY "Allow authenticated users to read inventory items" 
ON public.inventory_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert inventory items" 
ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update inventory items" 
ON public.inventory_items FOR UPDATE TO authenticated USING (true);

-- Transfers policies
CREATE POLICY "Allow authenticated users to read transfers" 
ON public.transfers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert transfers" 
ON public.transfers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow users to update their own transfers or admin users to update any transfer" 
ON public.transfers FOR UPDATE TO authenticated USING (
  requested_by_user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'isAdmin' = 'true'
  )
);

-- Enable Realtime 
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfers;

COMMIT;