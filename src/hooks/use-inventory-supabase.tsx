import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string;
  category_id: string | null;
  category?: { id: string; name: string } | null;
  quantity: number;
  min_stock_level: number | null;
  max_stock_level: number | null;
  cost_price: number;
  retail_price: number;
  tax_rate: number;
  supplier_id: string | null;
  supplier?: { id: string; name: string } | null;
  franchise_id: string | null;
  location: string | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  status_history?: StatusHistoryItem[];
};

export type StatusHistoryItem = {
  id: string;
  item_id: string;
  previous_status: string;
  new_status: string;
  updated_by: string;
  updated_at: string;
  notes: string | null;
  user_profiles?: { full_name: string } | null;
};

export type TransactionItem = {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  source_franchise_id: string | null;
  destination_franchise_id: string | null;
  created_by: string;
  created_at: string;
  notes: string | null;
  inventory_items?: {
    id: string;
    name: string;
    sku: string;
    barcode: string;
  } | null;
  source_franchise?: {
    id: string;
    name: string;
  } | null;
  destination_franchise?: {
    id: string;
    name: string;
  } | null;
  user_profiles?: {
    id: string;
    full_name: string;
  } | null;
  cost_price: number;
  retail_price: number;
};

export function useInventorySupabase() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  // Fetch all inventory items for the user's franchise or all franchises for franchisor
  const fetchInventory = useCallback(async (franchiseId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          categories(id, name),
          suppliers(id, name),
          status_history(
            id,
            previous_status,
            new_status,
            updated_at,
            updated_by,
            notes,
            user_profiles(full_name)
          )
        `)
        .order('updated_at', { ascending: false });

      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
      } else if (profile?.franchise_id && !profile?.role.includes('franchisor')) {
        // If user is franchisee, only show their franchise's inventory
        query = query.eq('franchise_id', profile.franchise_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  // Fetch a specific inventory item
  const fetchItem = async (itemId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          categories(id, name),
          suppliers(id, name),
          status_history(
            id,
            previous_status,
            new_status,
            updated_at,
            updated_by,
            notes,
            user_profiles(full_name)
          )
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching item:', error);
      return null;
    }
  };

  // Add a new inventory item
  const addItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'status_history'>) => {
    if (!user) return null;

    try {
      const newItem = {
        ...itemData,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      // Add initial status history
      await supabase.from('status_history').insert([{
        item_id: data.id,
        previous_status: '',
        new_status: data.status,
        updated_by: user.id,
        notes: 'Initial item creation',
      }]);

      // Refresh the inventory list
      fetchInventory(itemData.franchise_id || undefined);

      toast.success('Item added successfully');
      return data;
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
      return null;
    }
  };

  // Update an existing inventory item
  const updateItem = async (
    itemId: string, 
    updates: Partial<Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'status_history'>>
  ) => {
    if (!user) return null;

    try {
      // Get the current item to compare status
      const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('status')
        .eq('id', itemId)
        .single();

      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // If status was updated, add to status history
      if (updates.status && currentItem && updates.status !== currentItem.status) {
        await supabase.from('status_history').insert([{
          item_id: itemId,
          previous_status: currentItem.status,
          new_status: updates.status,
          updated_by: user.id,
          notes: updates.status === 'out_of_stock' ? 'Marked out of stock' : 
                 updates.status === 'low_stock' ? 'Marked low stock' : 
                 updates.status === 'in_stock' ? 'Marked in stock' : 
                 'Status updated',
        }]);
      }

      // Refresh the inventory list
      fetchInventory(data.franchise_id || undefined);

      toast.success('Item updated successfully');
      return data;
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
      return null;
    }
  };

  // Delete an inventory item
  const deleteItem = async (itemId: string) => {
    if (!user) return false;

    try {
      // First, delete associated status history
      const { error: historyError } = await supabase
        .from('status_history')
        .delete()
        .eq('item_id', itemId);

      if (historyError) throw historyError;

      // Then delete the item itself
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update the local state
      setItems(items.filter(item => item.id !== itemId));

      toast.success('Item deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
      return false;
    }
  };

  // Fetch transactions history
  const fetchTransactions = async (filters?: Record<string, any>) => {
    if (!user) return [];

    try {
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items(id, name, sku, barcode),
          source_franchise:source_franchise_id(id, name),
          destination_franchise:destination_franchise_id(id, name),
          user_profiles(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      // If user is franchisee, only show transactions related to their franchise
      if (profile?.franchise_id && !profile.role.includes('franchisor')) {
        query = query.or(`source_franchise_id.eq.${profile.franchise_id},destination_franchise_id.eq.${profile.franchise_id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user, fetchInventory]);

  return {
    items,
    isLoading,
    error,
    fetchInventory,
    fetchItem,
    addItem,
    updateItem,
    deleteItem,
    fetchTransactions
  };
}