export type ItemStatus = 'imported' | 'sold' | 'defective' | 'in_transit' | 'returned' | 'pending_transfer';

export interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  status: ItemStatus;
  location: string;
  category: string;
  importDate: string;
  lastUpdated: string;
  notes?: string;
  history: StatusHistory[];
}

export interface StatusHistory {
  id: string;
  date: string;
  previousStatus?: ItemStatus;
  newStatus: ItemStatus;
  updatedBy: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
}