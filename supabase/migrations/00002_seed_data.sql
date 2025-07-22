-- Seed initial data
BEGIN;

-- Insert categories
INSERT INTO public.categories (name, description)
VALUES
  ('Electronics', 'Electronic devices and components'),
  ('Furniture', 'Office and home furniture'),
  ('Stationery', 'Office supplies and stationery items'),
  ('Clothing', 'Apparel and accessories'),
  ('Tools', 'Hand and power tools'),
  ('Food & Beverages', 'Food and drink products'),
  ('Medical Supplies', 'Healthcare and medical equipment'),
  ('Cleaning Supplies', 'Cleaning products and janitorial supplies')
ON CONFLICT (id) DO NOTHING;

-- Insert locations
INSERT INTO public.locations (name, address, type)
VALUES
  ('Main Warehouse', '123 Storage Ave, Warehouse District', 'warehouse'),
  ('Downtown Store', '456 Main St, Downtown', 'store'),
  ('Supplier HQ', '789 Vendor Lane, Industrial Park', 'supplier'),
  ('North Branch', '321 North Road, Business Park', 'store'),
  ('East Storage', '654 East Blvd, Storage Complex', 'warehouse'),
  ('West Distribution Center', '987 West Highway, Distribution Zone', 'warehouse'),
  ('South Retail Outlet', '123 South Street, Shopping Mall', 'store')
ON CONFLICT (id) DO NOTHING;

-- Create a stored procedure to insert sample inventory items
CREATE OR REPLACE PROCEDURE insert_sample_inventory_items()
LANGUAGE plpgsql
AS $$
DECLARE
  category_ids UUID[];
  location_ids UUID[];
  i INTEGER;
  random_category_id UUID;
  random_location_id UUID;
  barcode TEXT;
  item_name TEXT;
  quantity INTEGER;
  unit_price DECIMAL(10, 2);
  status_options TEXT[] := ARRAY['active', 'active', 'active', 'inactive', 'archived'];
  random_status TEXT;
BEGIN
  -- Get all category and location IDs
  SELECT array_agg(id) INTO category_ids FROM public.categories;
  SELECT array_agg(id) INTO location_ids FROM public.locations;
  
  -- Insert 50 sample inventory items
  FOR i IN 1..50 LOOP
    -- Generate random values
    SELECT category_ids[floor(random() * array_length(category_ids, 1) + 1)] INTO random_category_id;
    SELECT location_ids[floor(random() * array_length(location_ids, 1) + 1)] INTO random_location_id;
    barcode := 'ITEM-' || LPAD(i::TEXT, 6, '0');
    
    -- Set name based on category
    CASE 
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Electronics') THEN
        item_name := 'Electronic Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Furniture') THEN
        item_name := 'Furniture Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Stationery') THEN
        item_name := 'Stationery Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Clothing') THEN
        item_name := 'Clothing Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Tools') THEN
        item_name := 'Tool Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Food & Beverages') THEN
        item_name := 'Food Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Medical Supplies') THEN
        item_name := 'Medical Item ' || i;
      WHEN random_category_id = (SELECT id FROM public.categories WHERE name = 'Cleaning Supplies') THEN
        item_name := 'Cleaning Item ' || i;
      ELSE
        item_name := 'Generic Item ' || i;
    END CASE;
    
    quantity := floor(random() * 100 + 1);
    unit_price := round((random() * 500)::numeric, 2);
    SELECT status_options[floor(random() * array_length(status_options, 1) + 1)] INTO random_status;
    
    -- Insert inventory item
    INSERT INTO public.inventory_items (
      barcode, 
      name, 
      description, 
      category_id, 
      location_id, 
      quantity, 
      unit_price, 
      status
    )
    VALUES (
      barcode, 
      item_name, 
      'Description for ' || item_name, 
      random_category_id, 
      random_location_id, 
      quantity, 
      unit_price, 
      random_status
    )
    ON CONFLICT (barcode) DO NOTHING;
  END LOOP;
  
  -- Insert some specific items for testing
  INSERT INTO public.inventory_items (
    barcode, 
    name, 
    description, 
    category_id, 
    location_id, 
    quantity, 
    unit_price, 
    status
  )
  VALUES (
    'LAPTOP-001', 
    'Dell XPS 13 Laptop', 
    'High-performance laptop for business use', 
    (SELECT id FROM public.categories WHERE name = 'Electronics'), 
    (SELECT id FROM public.locations WHERE name = 'Main Warehouse'), 
    25, 
    1299.99, 
    'active'
  ),
  (
    'DESK-001', 
    'Standing Desk', 
    'Adjustable height standing desk', 
    (SELECT id FROM public.categories WHERE name = 'Furniture'), 
    (SELECT id FROM public.locations WHERE name = 'East Storage'), 
    10, 
    349.99, 
    'active'
  ),
  (
    'PEN-001', 
    'Premium Ballpoint Pen', 
    'High-quality ballpoint pen with smooth ink flow', 
    (SELECT id FROM public.categories WHERE name = 'Stationery'), 
    (SELECT id FROM public.locations WHERE name = 'Downtown Store'), 
    200, 
    3.99, 
    'active'
  )
  ON CONFLICT (barcode) DO NOTHING;
END;
$$;

-- Call the procedure to insert sample inventory items
CALL insert_sample_inventory_items();

-- Insert sample transfers
INSERT INTO public.transfers (
  source_location_id,
  destination_location_id,
  requested_by_user_id,
  status,
  items,
  notes
)
SELECT
  (SELECT id FROM public.locations WHERE name = 'Main Warehouse'),
  (SELECT id FROM public.locations WHERE name = 'Downtown Store'),
  (SELECT id FROM auth.users LIMIT 1),
  'pending',
  '[
    {
      "id": "' || (SELECT id FROM public.inventory_items WHERE barcode = 'LAPTOP-001') || '",
      "quantity": 5,
      "barcode": "LAPTOP-001",
      "name": "Dell XPS 13 Laptop"
    },
    {
      "id": "' || (SELECT id FROM public.inventory_items WHERE barcode = 'DESK-001') || '",
      "quantity": 2,
      "barcode": "DESK-001",
      "name": "Standing Desk"
    }
  ]'::jsonb,
  'Transfer of high-demand items to downtown location'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transfers (
  source_location_id,
  destination_location_id,
  requested_by_user_id,
  status,
  items,
  notes
)
SELECT
  (SELECT id FROM public.locations WHERE name = 'East Storage'),
  (SELECT id FROM public.locations WHERE name = 'North Branch'),
  (SELECT id FROM auth.users LIMIT 1),
  'pending',
  '[
    {
      "id": "' || (SELECT id FROM public.inventory_items WHERE barcode = 'PEN-001') || '",
      "quantity": 50,
      "barcode": "PEN-001",
      "name": "Premium Ballpoint Pen"
    }
  ]'::jsonb,
  'Transfer of office supplies to North Branch'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (id) DO NOTHING;

COMMIT;