import { useEffect, useState } from 'react';
import { useActivityLogger } from './use-activity-logger';
import { useAlerts } from '@/components/notifications/alert-provider';

// Define thresholds for low stock alerts
const LOW_STOCK_THRESHOLD = 10; // Alert when item quantity falls below this level
const CRITICAL_STOCK_THRESHOLD = 5; // Critical alert when stock falls below this level

export function useInventoryAlerts() {
  const { getActivityLogs } = useActivityLogger();
  const { addAlert } = useAlerts();
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Function to check for items with low stock based on recent activity
  const checkLowStockItems = async () => {
    try {
      // Get recent inventory activities
      const logs = await getActivityLogs({
        limit: 100,
        actions: ["stock_adjustment", "sale", "transfer_approve"] // Activities that affect stock levels
      });
      
      // Group logs by item and find latest stock level for each
      const itemStockLevels: Record<string, {
        itemId: string;
        itemName: string;
        quantity: number;
        location: string;
      }> = {};
      
      // Process logs to determine current stock levels
      logs.forEach(log => {
        // Skip if no item info
        if (!log.item_id) return;
        
        const itemKey = `${log.item_id}_${log.location_id || 'default'}`;
        
        if (!itemStockLevels[itemKey] || new Date(log.timestamp) > new Date(itemStockLevels[itemKey].timestamp)) {
          // Details structure varies by action type
          let quantity = 0;
          
          if (log.action === 'stock_adjustment' && log.details?.quantityAfter !== undefined) {
            quantity = log.details.quantityAfter;
          } else if (log.action === 'sale' && log.details?.quantityAfter !== undefined) {
            quantity = log.details.quantityAfter;
          } else if (log.action === 'transfer_approve' && log.details?.quantity !== undefined) {
            // For transfers, we'd need more context to determine resulting quantities
            // This is a simplification
            quantity = log.details.quantity;
          }
          
          itemStockLevels[itemKey] = {
            itemId: log.item_id,
            itemName: log.item_name || 'Unknown Item',
            quantity,
            location: log.location_name || 'Unknown Location',
            timestamp: log.timestamp
          };
        }
      });
      
      // Check for low stock items and generate alerts
      Object.values(itemStockLevels).forEach(item => {
        if (item.quantity <= CRITICAL_STOCK_THRESHOLD) {
          addAlert({
            type: 'error',
            title: 'Critical Stock Level',
            message: `${item.itemName} is critically low (${item.quantity} remaining) at ${item.location}`,
            actionUrl: `/inventory?item=${item.itemId}`,
            actionText: 'View Item'
          });
        } else if (item.quantity <= LOW_STOCK_THRESHOLD) {
          addAlert({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${item.itemName} is running low (${item.quantity} remaining) at ${item.location}`,
            actionUrl: `/inventory?item=${item.itemId}`,
            actionText: 'View Item'
          });
        }
      });
      
      // Check for unusual activity (e.g., large quantity changes)
      checkForUnusualActivity(logs);
      
    } catch (error) {
      console.error('Error checking low stock items:', error);
    }
  };
  
  // Function to detect unusual activity based on patterns
  const checkForUnusualActivity = (logs: any[]) => {
    // Look for large quantity changes (more than 50% decrease)
    logs.forEach(log => {
      if (
        log.action === 'stock_adjustment' && 
        log.details?.quantityBefore !== undefined &&
        log.details?.quantityAfter !== undefined
      ) {
        const before = log.details.quantityBefore;
        const after = log.details.quantityAfter;
        
        // If quantity decreased by more than 50% and it was a significant amount (>10 items)
        if (before > 10 && after < before * 0.5) {
          addAlert({
            type: 'info',
            title: 'Unusual Stock Change Detected',
            message: `${log.item_name} stock reduced from ${before} to ${after} units`,
            actionUrl: `/logs?item=${log.item_id}`,
            actionText: 'View Activity'
          });
        }
      }
    });
  };
  
  // Start monitoring for inventory alerts
  const startMonitoring = () => {
    if (!isMonitoring) {
      // Immediately check on startup
      checkLowStockItems();
      
      // Set monitoring state to true
      setIsMonitoring(true);
      
      // Welcome alert
      addAlert({
        type: 'info',
        title: 'Inventory Monitoring Active',
        message: 'You will now receive alerts for low stock and unusual activity',
      });
    }
  };
  
  // Stop monitoring for inventory alerts
  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    addAlert({
      type: 'info',
      title: 'Inventory Monitoring Paused',
      message: 'You will no longer receive automatic inventory alerts',
    });
  };
  
  // Set up initial monitoring and periodic checks
  useEffect(() => {
    startMonitoring();
    
    // Set up periodic check every 30 minutes if monitoring is active
    let intervalId: NodeJS.Timeout;
    
    if (isMonitoring) {
      intervalId = setInterval(() => {
        checkLowStockItems();
      }, 30 * 60 * 1000); // 30 minutes
    }
    
    // Clean up on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring]);
  
  // Functions to simulate alerts for testing
  const simulateLowStockAlert = (itemName: string, quantity: number) => {
    addAlert({
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${itemName} is running low (${quantity} remaining)`,
      actionUrl: `/inventory?search=${itemName}`,
      actionText: 'View Item'
    });
  };
  
  const simulateCriticalStockAlert = (itemName: string, quantity: number) => {
    addAlert({
      type: 'error',
      title: 'Critical Stock Level',
      message: `${itemName} is critically low (${quantity} remaining)`,
      actionUrl: `/inventory?search=${itemName}`,
      actionText: 'View Item'
    });
  };
  
  const simulateUnusualActivityAlert = (itemName: string, before: number, after: number) => {
    addAlert({
      type: 'info',
      title: 'Unusual Stock Change Detected',
      message: `${itemName} stock changed from ${before} to ${after} units`,
      actionUrl: `/logs`,
      actionText: 'View Activity'
    });
  };
  
  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    checkLowStockItems,
    // Simulation functions for testing
    simulateLowStockAlert,
    simulateCriticalStockAlert,
    simulateUnusualActivityAlert
  };
}