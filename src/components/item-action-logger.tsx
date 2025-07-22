import { useActivityLogger } from "@/hooks/use-activity-logger";
import { toast } from "sonner";

// A utility component to log inventory actions
// This is not rendered visually - it's a logic wrapper that 
// can be imported where item operations occur

interface ItemActionLoggerProps {
  children: (logger: {
    logItemScan: (barcode: string, itemName: string, locationName?: string) => Promise<void>;
    logItemUpdate: (
      itemId: string,
      itemName: string,
      itemBarcode: string,
      changes: Record<string, any>,
      quantityBefore?: number,
      quantityAfter?: number
    ) => Promise<void>;
    logItemTransfer: (
      transferId: string,
      itemId: string,
      itemName: string,
      fromLocation: string,
      toLocation: string, 
      quantity: number,
      status: 'created' | 'approved' | 'rejected'
    ) => Promise<void>;
    logItemSale: (
      itemId: string,
      itemName: string,
      itemBarcode: string,
      quantity: number,
      amount: number,
      location: string
    ) => Promise<void>;
    logStockAdjustment: (
      itemId: string,
      itemName: string,
      itemBarcode: string,
      quantityBefore: number,
      quantityAfter: number,
      reason: string,
      location: string
    ) => Promise<void>;
  }) => React.ReactNode;
}

export function ItemActionLogger({ children }: ItemActionLoggerProps) {
  const { logActivity } = useActivityLogger();
  
  // Log when an item is scanned
  const logItemScan = async (
    barcode: string, 
    itemName: string, 
    locationName?: string
  ) => {
    try {
      await logActivity('scan_in', {
        barcode,
        scanned_at: new Date().toISOString()
      }, {
        itemBarcode: barcode,
        itemName,
        locationName
      });
    } catch (error) {
      console.error('Failed to log item scan:', error);
    }
  };
  
  // Log when an item is updated
  const logItemUpdate = async (
    itemId: string,
    itemName: string,
    itemBarcode: string,
    changes: Record<string, any>,
    quantityBefore?: number,
    quantityAfter?: number
  ) => {
    try {
      await logActivity('item_update', {
        changes,
        updated_at: new Date().toISOString()
      }, {
        itemId,
        itemName,
        itemBarcode,
        quantityBefore,
        quantityAfter
      });
    } catch (error) {
      console.error('Failed to log item update:', error);
    }
  };
  
  // Log transfer operations
  const logItemTransfer = async (
    transferId: string,
    itemId: string,
    itemName: string,
    fromLocation: string,
    toLocation: string, 
    quantity: number,
    status: 'created' | 'approved' | 'rejected'
  ) => {
    try {
      const actionMap = {
        'created': 'transfer_create',
        'approved': 'transfer_approve',
        'rejected': 'transfer_reject'
      } as const;
      
      await logActivity(actionMap[status], {
        transfer_id: transferId,
        from_location: fromLocation,
        to_location: toLocation,
        quantity,
        status,
        timestamp: new Date().toISOString()
      }, {
        itemId,
        itemName,
        locationName: status === 'created' ? fromLocation : toLocation,
      });
    } catch (error) {
      console.error(`Failed to log transfer ${status}:`, error);
    }
  };
  
  // Log sales
  const logItemSale = async (
    itemId: string,
    itemName: string,
    itemBarcode: string,
    quantity: number,
    amount: number,
    location: string
  ) => {
    try {
      await logActivity('sale', {
        amount,
        currency: 'USD', // Would come from settings in real app
        sale_date: new Date().toISOString()
      }, {
        itemId,
        itemName,
        itemBarcode,
        locationName: location,
        quantityBefore: quantity, // This assumes we're tracking before the sale occurs
        quantityAfter: 0 // This would be updated with actual quantity after sale
      });
    } catch (error) {
      console.error('Failed to log item sale:', error);
    }
  };
  
  // Log stock adjustments
  const logStockAdjustment = async (
    itemId: string,
    itemName: string,
    itemBarcode: string,
    quantityBefore: number,
    quantityAfter: number,
    reason: string,
    location: string
  ) => {
    try {
      await logActivity('stock_adjustment', {
        reason,
        adjustment_date: new Date().toISOString(),
        adjustment_amount: quantityAfter - quantityBefore
      }, {
        itemId,
        itemName,
        itemBarcode,
        locationName: location,
        quantityBefore,
        quantityAfter
      });
    } catch (error) {
      console.error('Failed to log stock adjustment:', error);
    }
  };
  
  // Expose logging functions to children
  return <>{children({
    logItemScan,
    logItemUpdate,
    logItemTransfer,
    logItemSale,
    logStockAdjustment
  })}</>;
}

// Example usage:
// <ItemActionLogger>
//   {({ logItemScan }) => (
//     <Button onClick={() => {
//       // Perform your scan action
//       logItemScan('123456789', 'Product Name', 'Warehouse A');
//     }}>
//       Scan Item
//     </Button>
//   )}
// </ItemActionLogger>