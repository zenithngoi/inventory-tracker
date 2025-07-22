import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocalStorageFallback } from './use-local-storage-fallback';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export type PendingAction = {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
};

export const useSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { getItems, setItems, removeItem } = useLocalStorageFallback();
  const { user } = useAuth();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Add a pending action to the queue
  const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const pendingActions = getItems('pendingActions') || [];
    
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    pendingActions.push(newAction);
    setItems('pendingActions', pendingActions);
    
    return newAction.id;
  };

  // Remove a pending action from the queue
  const removePendingAction = (actionId: string) => {
    const pendingActions = getItems('pendingActions') || [];
    const updatedActions = pendingActions.filter(
      (action: PendingAction) => action.id !== actionId
    );
    
    setItems('pendingActions', updatedActions);
  };

  // Sync a single pending action to Supabase
  const syncAction = async (action: PendingAction): Promise<boolean> => {
    if (!user) return false;
    
    try {
      let result;
      
      switch (action.action) {
        case 'create':
          result = await supabase
            .from(action.table)
            .insert(action.data);
          break;
          
        case 'update':
          result = await supabase
            .from(action.table)
            .update(action.data)
            .eq('id', action.data.id);
          break;
          
        case 'delete':
          result = await supabase
            .from(action.table)
            .delete()
            .eq('id', action.data.id);
          break;
      }
      
      if (result?.error) {
        console.error(`Error syncing ${action.action} for ${action.table}:`, result.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Exception syncing ${action.action} for ${action.table}:`, error);
      return false;
    }
  };

  // Sync all pending actions
  const syncPendingActions = async (): Promise<void> => {
    if (!user || !isOnline || isSyncing) return;
    
    const pendingActions = getItems('pendingActions') || [];
    if (pendingActions.length === 0) return;
    
    setIsSyncing(true);
    
    try {
      const notification = toast.loading(`Syncing ${pendingActions.length} pending actions...`);
      
      // Process actions in chronological order (oldest first)
      const sortedActions = [...pendingActions].sort((a, b) => a.timestamp - b.timestamp);
      
      const successfulIds: string[] = [];
      const failedActions: PendingAction[] = [];
      
      for (const action of sortedActions) {
        const success = await syncAction(action);
        
        if (success) {
          successfulIds.push(action.id);
        } else {
          failedActions.push(action);
        }
      }
      
      // Remove successful actions
      const remainingActions = pendingActions.filter(
        (action: PendingAction) => !successfulIds.includes(action.id)
      );
      
      setItems('pendingActions', remainingActions);
      
      if (failedActions.length === 0) {
        toast.success(`Successfully synced ${successfulIds.length} actions`, {
          id: notification,
        });
      } else {
        toast.warning(
          `Synced ${successfulIds.length} actions, ${failedActions.length} failed and will retry later`, 
          { id: notification }
        );
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Error syncing data. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual sync trigger
  const triggerSync = () => {
    if (isOnline && !isSyncing) {
      syncPendingActions();
    } else if (!isOnline) {
      toast.error('Cannot sync while offline');
    }
  };

  // Check if there are any pending actions
  const getPendingActionsCount = (): number => {
    const pendingActions = getItems('pendingActions') || [];
    return pendingActions.length;
  };

  // Sync inventory items stored locally when coming back online
  const syncLocalInventory = async () => {
    if (!isOnline || !user) return;
    
    const localInventory = getItems('inventory_items') || [];
    
    if (localInventory.length > 0) {
      try {
        // For each local item, check if it exists in Supabase
        for (const item of localInventory) {
          const { data: existingItem } = await supabase
            .from('inventory_items')
            .select('id')
            .eq('id', item.id)
            .single();
          
          // If it doesn't exist, add a pending action to create it
          if (!existingItem) {
            addPendingAction({
              action: 'create',
              table: 'inventory_items',
              data: {
                ...item,
                user_id: user.id
              }
            });
          }
        }
        
        // Trigger sync to process the pending actions
        syncPendingActions();
      } catch (error) {
        console.error('Error syncing local inventory:', error);
      }
    }
  };

  // Sync transfers stored locally when coming back online
  const syncLocalTransfers = async () => {
    if (!isOnline || !user) return;
    
    const localTransfers = getItems('transfers') || [];
    
    if (localTransfers.length > 0) {
      try {
        // For each local transfer, check if it exists in Supabase
        for (const transfer of localTransfers) {
          const { data: existingTransfer } = await supabase
            .from('transfers')
            .select('id')
            .eq('id', transfer.id)
            .single();
          
          // If it doesn't exist, add a pending action to create it
          if (!existingTransfer) {
            addPendingAction({
              action: 'create',
              table: 'transfers',
              data: {
                ...transfer,
                requested_by_user_id: user.id
              }
            });
          }
        }
        
        // Trigger sync to process the pending actions
        syncPendingActions();
      } catch (error) {
        console.error('Error syncing local transfers:', error);
      }
    }
  };

  // Auto-sync when coming back online or when user changes
  useEffect(() => {
    if (isOnline && user) {
      syncPendingActions();
      syncLocalInventory();
      syncLocalTransfers();
    }
  }, [isOnline, user]);

  return {
    isOnline,
    isSyncing,
    addPendingAction,
    removePendingAction,
    syncPendingActions,
    triggerSync,
    getPendingActionsCount,
    syncLocalInventory,
    syncLocalTransfers
  };
};