import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocalStorageFallback } from '@/hooks/use-local-storage-fallback';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export type ActivityAction = 
  | 'scan_in' 
  | 'transfer_create' 
  | 'transfer_approve' 
  | 'transfer_reject' 
  | 'item_update' 
  | 'item_delete'
  | 'stock_adjustment'
  | 'sale'
  | 'purchase'
  | 'location_change'
  | 'category_change';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  timestamp: string;
  action: ActivityAction;
  item_id?: string;
  item_name?: string;
  item_barcode?: string;
  location_id?: string;
  location_name?: string;
  category_id?: string;
  category_name?: string;
  quantity_before?: number;
  quantity_after?: number;
  details: Record<string, any>;
  synced: boolean;
}

interface ActivityLoggerContextType {
  logActivity: (action: ActivityAction, details: Record<string, any>, options?: {
    itemId?: string;
    itemName?: string;
    itemBarcode?: string;
    locationId?: string;
    locationName?: string;
    categoryId?: string;
    categoryName?: string;
    quantityBefore?: number;
    quantityAfter?: number;
  }) => Promise<string | null>;
  getActivityLogs: (filters?: {
    userId?: string;
    itemId?: string;
    action?: ActivityAction;
    startDate?: Date;
    endDate?: Date;
    locationId?: string;
    limit?: number;
    offset?: number;
  }) => Promise<ActivityLog[]>;
  getItemHistory: (itemId: string) => Promise<ActivityLog[]>;
  getUserHistory: (userId: string) => Promise<ActivityLog[]>;
  getPendingLogs: () => ActivityLog[];
  syncPendingLogs: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const ActivityLoggerContext = createContext<ActivityLoggerContextType | undefined>(undefined);

interface ActivityLoggerProviderProps {
  children: ReactNode;
}

export const ActivityLoggerProvider = ({ children }: ActivityLoggerProviderProps) => {
  const { user } = useAuth();
  const { getItems, setItems, appendToArray, updateItemInArray } = useLocalStorageFallback();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Log an activity
  const logActivity = async (
    action: ActivityAction, 
    details: Record<string, any>,
    options?: {
      itemId?: string;
      itemName?: string;
      itemBarcode?: string;
      locationId?: string;
      locationName?: string;
      categoryId?: string;
      categoryName?: string;
      quantityBefore?: number;
      quantityAfter?: number;
    }
  ): Promise<string | null> => {
    try {
      if (!user) {
        setError('Must be logged in to log activity');
        return null;
      }
      
      const logId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const logEntry: ActivityLog = {
        id: logId,
        user_id: user.id,
        user_email: user.email || undefined,
        user_name: user.user_metadata?.full_name || undefined,
        timestamp,
        action,
        item_id: options?.itemId,
        item_name: options?.itemName,
        item_barcode: options?.itemBarcode,
        location_id: options?.locationId,
        location_name: options?.locationName,
        category_id: options?.categoryId,
        category_name: options?.categoryName,
        quantity_before: options?.quantityBefore,
        quantity_after: options?.quantityAfter,
        details,
        synced: false
      };
      
      // Store locally first
      const localLogs = getItems('activityLogs') || [];
      setItems('activityLogs', [...localLogs, logEntry]);
      
      // If online, sync immediately
      if (isSupabaseConfigured() && navigator.onLine) {
        await syncLog(logEntry);
      } else {
        // Add to pending actions
        const pendingActions = getItems('pendingActions') || [];
        setItems('pendingActions', [
          ...pendingActions,
          {
            id: uuidv4(),
            type: 'SYNC_ACTIVITY_LOG',
            data: { logId },
            timestamp
          }
        ]);
      }
      
      return logId;
    } catch (error) {
      console.error('Failed to log activity:', error);
      setError('Failed to log activity');
      return null;
    }
  };
  
  // Sync a single log entry
  const syncLog = async (logEntry: ActivityLog): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured()) return false;
      
      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          id: logEntry.id,
          user_id: logEntry.user_id,
          user_email: logEntry.user_email,
          user_name: logEntry.user_name,
          timestamp: logEntry.timestamp,
          action: logEntry.action,
          item_id: logEntry.item_id,
          item_name: logEntry.item_name,
          item_barcode: logEntry.item_barcode,
          location_id: logEntry.location_id,
          location_name: logEntry.location_name,
          category_id: logEntry.category_id,
          category_name: logEntry.category_name,
          quantity_before: logEntry.quantity_before,
          quantity_after: logEntry.quantity_after,
          details: logEntry.details
        }]);
      
      if (error) {
        console.error('Error syncing log to Supabase:', error);
        return false;
      }
      
      // Update local storage to mark as synced
      const localLogs = getItems('activityLogs') || [];
      const updatedLogs = localLogs.map((log: ActivityLog) => 
        log.id === logEntry.id ? { ...log, synced: true } : log
      );
      setItems('activityLogs', updatedLogs);
      
      return true;
    } catch (error) {
      console.error('Failed to sync log:', error);
      return false;
    }
  };

  // Get activity logs with optional filters
  const getActivityLogs = async (filters?: {
    userId?: string;
    itemId?: string;
    action?: ActivityAction;
    startDate?: Date;
    endDate?: Date;
    locationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSupabaseConfigured() && navigator.onLine) {
        // Start building the query
        let query = supabase
          .from('activity_logs')
          .select('*');
        
        // Apply filters
        if (filters?.userId) query = query.eq('user_id', filters.userId);
        if (filters?.itemId) query = query.eq('item_id', filters.itemId);
        if (filters?.action) query = query.eq('action', filters.action);
        if (filters?.locationId) query = query.eq('location_id', filters.locationId);
        
        if (filters?.startDate) {
          query = query.gte('timestamp', filters.startDate.toISOString());
        }
        
        if (filters?.endDate) {
          query = query.lte('timestamp', filters.endDate.toISOString());
        }
        
        // Order by timestamp descending (newest first)
        query = query.order('timestamp', { ascending: false });
        
        // Apply pagination
        if (filters?.limit) query = query.limit(filters.limit);
        if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching logs from Supabase:', error);
          throw error;
        }
        
        // Merge with local logs
        const localLogs: ActivityLog[] = getItems('activityLogs') || [];
        const localUnsyncedLogs = localLogs.filter(log => !log.synced);
        
        // Combine and sort
        const allLogs = [...data, ...localUnsyncedLogs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return allLogs;
      } else {
        // Offline mode - return from local storage
        const localLogs: ActivityLog[] = getItems('activityLogs') || [];
        
        // Apply filters locally
        let filteredLogs = localLogs;
        
        if (filters?.userId) {
          filteredLogs = filteredLogs.filter(log => log.user_id === filters.userId);
        }
        
        if (filters?.itemId) {
          filteredLogs = filteredLogs.filter(log => log.item_id === filters.itemId);
        }
        
        if (filters?.action) {
          filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }
        
        if (filters?.locationId) {
          filteredLogs = filteredLogs.filter(log => log.location_id === filters.locationId);
        }
        
        if (filters?.startDate) {
          filteredLogs = filteredLogs.filter(
            log => new Date(log.timestamp) >= filters.startDate!
          );
        }
        
        if (filters?.endDate) {
          filteredLogs = filteredLogs.filter(
            log => new Date(log.timestamp) <= filters.endDate!
          );
        }
        
        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Apply pagination
        if (filters?.limit && filters?.offset !== undefined) {
          filteredLogs = filteredLogs.slice(filters.offset, filters.offset + filters.limit);
        } else if (filters?.limit) {
          filteredLogs = filteredLogs.slice(0, filters.limit);
        }
        
        return filteredLogs;
      }
    } catch (error) {
      console.error('Error getting activity logs:', error);
      setError('Failed to load activity logs');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get history for a specific item
  const getItemHistory = async (itemId: string): Promise<ActivityLog[]> => {
    return getActivityLogs({ itemId });
  };
  
  // Get history for a specific user
  const getUserHistory = async (userId: string): Promise<ActivityLog[]> => {
    return getActivityLogs({ userId });
  };
  
  // Get pending logs that haven't been synced
  const getPendingLogs = (): ActivityLog[] => {
    const localLogs: ActivityLog[] = getItems('activityLogs') || [];
    return localLogs.filter(log => !log.synced);
  };
  
  // Sync all pending logs
  const syncPendingLogs = async (): Promise<boolean> => {
    if (!isSupabaseConfigured() || !navigator.onLine) {
      return false;
    }
    
    try {
      setIsLoading(true);
      const pendingLogs = getPendingLogs();
      
      if (pendingLogs.length === 0) {
        return true;
      }
      
      let allSuccessful = true;
      
      for (const log of pendingLogs) {
        const success = await syncLog(log);
        if (!success) {
          allSuccessful = false;
        }
      }
      
      // Clean up pending actions
      const pendingActions = getItems('pendingActions') || [];
      const updatedPendingActions = pendingActions.filter(
        (action: any) => action.type !== 'SYNC_ACTIVITY_LOG'
      );
      setItems('pendingActions', updatedPendingActions);
      
      return allSuccessful;
    } catch (error) {
      console.error('Error syncing pending logs:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sync logs when coming online
  useEffect(() => {
    const handleOnline = () => {
      if (isSupabaseConfigured()) {
        syncPendingLogs().then(success => {
          if (success) {
            toast.success('Activity logs synchronized');
          }
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const value = {
    logActivity,
    getActivityLogs,
    getItemHistory,
    getUserHistory,
    getPendingLogs,
    syncPendingLogs,
    isLoading,
    error
  };

  return (
    <ActivityLoggerContext.Provider value={value}>
      {children}
    </ActivityLoggerContext.Provider>
  );
};

export const useActivityLogger = () => {
  const context = useContext(ActivityLoggerContext);
  
  if (context === undefined) {
    throw new Error('useActivityLogger must be used within an ActivityLoggerProvider');
  }
  
  return context;
};