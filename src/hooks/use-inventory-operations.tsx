import { useState } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from './use-inventory-supabase';

export type TransferResult = {
  success: boolean;
  message: string;
  transferId?: string;
};

export function useInventoryOperations() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Transfer inventory between franchises
  const transferInventory = async (
    items: { itemId: string; quantity: number }[],
    sourceFranchiseId: string,
    destinationFranchiseId: string,
    notes: string
  ): Promise<TransferResult> => {
    if (!user) {
      return { success: false, message: 'You must be logged in to perform this operation' };
    }

    if (sourceFranchiseId === destinationFranchiseId) {
      return { success: false, message: 'Source and destination franchises must be different' };
    }

    setIsLoading(true);
    try {
      // Call the supabase function
      const { data, error } = await supabase.rpc('transfer_inventory', {
        p_item_ids: items.map(item => item.itemId),
        p_quantities: items.map(item => item.quantity),
        p_source_id: sourceFranchiseId,
        p_destination_id: destinationFranchiseId,
        p_user_id: user.id,
        p_notes: notes
      });

      if (error) throw error;

      const transferId = data?.transaction_id;

      toast.success('Inventory transfer completed successfully');
      return { 
        success: true, 
        message: 'Transfer completed successfully', 
        transferId 
      };
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(`Transfer failed: ${error.message}`);
      return { success: false, message: `Failed to transfer inventory: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust inventory quantity (for corrections, losses, etc.)
  const adjustInventory = async (
    itemId: string,
    newQuantity: number,
    reason: string
  ) => {
    if (!user) {
      return { success: false, message: 'You must be logged in to perform this operation' };
    }

    setIsLoading(true);
    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('quantity, cost_price, retail_price, franchise_id')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate quantity difference
      const quantityDiff = newQuantity - currentItem.quantity;
      const transactionType = quantityDiff > 0 ? 'adjustment_increase' : 'adjustment_decrease';

      // Update the item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert([{
          id: uuidv4(),
          item_id: itemId,
          transaction_type: transactionType,
          quantity: Math.abs(quantityDiff),
          source_franchise_id: currentItem.franchise_id,
          destination_franchise_id: null,
          created_by: user.id,
          created_at: new Date().toISOString(),
          notes: reason,
          cost_price: currentItem.cost_price,
          retail_price: currentItem.retail_price
        }]);

      if (transactionError) throw transactionError;

      toast.success('Inventory quantity adjusted successfully');
      return { success: true, message: 'Inventory adjusted successfully' };
    } catch (error: any) {
      console.error('Adjustment error:', error);
      toast.error(`Adjustment failed: ${error.message}`);
      return { success: false, message: `Failed to adjust inventory: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  };

  // Process a sale of inventory items
  const processSale = async (
    items: { item: InventoryItem; quantity: number }[],
    saleNotes: string
  ) => {
    if (!user || !profile?.franchise_id) {
      return { success: false, message: 'You must be logged in with a franchise association to process sales' };
    }

    setIsLoading(true);
    try {
      // Create a transaction for each sold item
      const salesTransactions = items.map(({ item, quantity }) => ({
        id: uuidv4(),
        item_id: item.id,
        transaction_type: 'sale',
        quantity: quantity,
        source_franchise_id: profile.franchise_id,
        destination_franchise_id: null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        notes: saleNotes,
        cost_price: item.cost_price,
        retail_price: item.retail_price
      }));

      // Insert all sales transactions
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert(salesTransactions);

      if (transactionError) throw transactionError;

      // Update inventory quantities
      for (const { item, quantity } of items) {
        const newQuantity = Math.max(0, item.quantity - quantity);
        
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
            // Update status based on new quantity
            status: newQuantity <= 0 ? 'out_of_stock' : 
                  (item.min_stock_level && newQuantity <= item.min_stock_level) ? 'low_stock' : 'in_stock'
          })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      toast.success('Sale processed successfully');
      return { success: true, message: 'Sale processed successfully' };
    } catch (error: any) {
      console.error('Sale processing error:', error);
      toast.error(`Sale processing failed: ${error.message}`);
      return { success: false, message: `Failed to process sale: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  };

  // Receive inventory from a supplier
  const receiveInventory = async (
    items: { item: InventoryItem; quantity: number; costPrice?: number }[],
    notes: string
  ) => {
    if (!user || !profile?.franchise_id) {
      return { success: false, message: 'You must be logged in with a franchise association to receive inventory' };
    }

    setIsLoading(true);
    try {
      // Create a transaction for each received item
      for (const { item, quantity, costPrice } of items) {
        // Update inventory quantity and potentially cost price
        const updates: any = { 
          quantity: item.quantity + quantity,
          updated_at: new Date().toISOString(),
        };
        
        // Update cost price if provided
        if (costPrice !== undefined) {
          updates.cost_price = costPrice;
        }
        
        // Update status based on new quantity
        updates.status = (updates.quantity <= 0) ? 'out_of_stock' : 
                         (item.min_stock_level && updates.quantity <= item.min_stock_level) ? 'low_stock' : 'in_stock';
        
        // Update the inventory item
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update(updates)
          .eq('id', item.id);

        if (updateError) throw updateError;

        // Record the transaction
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert([{
            id: uuidv4(),
            item_id: item.id,
            transaction_type: 'receive',
            quantity: quantity,
            source_franchise_id: null,
            destination_franchise_id: profile.franchise_id,
            created_by: user.id,
            created_at: new Date().toISOString(),
            notes: notes,
            cost_price: costPrice || item.cost_price,
            retail_price: item.retail_price
          }]);

        if (transactionError) throw transactionError;
      }

      toast.success('Inventory received successfully');
      return { success: true, message: 'Inventory received successfully' };
    } catch (error: any) {
      console.error('Receive inventory error:', error);
      toast.error(`Failed to receive inventory: ${error.message}`);
      return { success: false, message: `Failed to receive inventory: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    transferInventory,
    adjustInventory,
    processSale,
    receiveInventory
  };
}