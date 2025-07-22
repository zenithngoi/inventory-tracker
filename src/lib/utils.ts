import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { InventoryItem, ItemStatus, StatusHistory } from "@/types";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Save inventory to local storage
export const saveInventory = (items: InventoryItem[]): void => {
  localStorage.setItem("inventoryItems", JSON.stringify(items));
};

// Load inventory from local storage
export const loadInventory = (): InventoryItem[] => {
  const stored = localStorage.getItem("inventoryItems");
  return stored ? JSON.parse(stored) : [];
};

// Initialize inventory with sample data if empty
export const initializeInventory = (initialData: InventoryItem[]): void => {
  if (!localStorage.getItem("inventoryItems")) {
    saveInventory(initialData);
  }
};

// Update item status
export const updateItemStatus = (
  item: InventoryItem,
  newStatus: ItemStatus,
  updatedBy: string,
  notes?: string
): InventoryItem => {
  const now = new Date().toISOString();
  
  const historyEntry: StatusHistory = {
    id: uuidv4(),
    date: now,
    previousStatus: item.status,
    newStatus,
    updatedBy,
    notes,
  };

  return {
    ...item,
    status: newStatus,
    lastUpdated: now,
    notes: notes || item.notes,
    history: [...item.history, historyEntry],
  };
};

// Format date for display
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Generate a unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Check if barcode exists
export const barcodeExists = (barcode: string, items: InventoryItem[]): boolean => {
  return items.some(item => item.barcode === barcode);
};

// Get item by barcode
export const getItemByBarcode = (barcode: string, items: InventoryItem[]): InventoryItem | undefined => {
  return items.find(item => item.barcode === barcode);
};

// Get status color
export const getStatusColor = (status: ItemStatus): string => {
  switch (status) {
    case "imported":
      return "bg-green-500";
    case "sold":
      return "bg-blue-500";
    case "defective":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

// Get status text color
export const getStatusTextColor = (status: ItemStatus): string => {
  switch (status) {
    case "imported":
      return "text-green-500";
    case "sold":
      return "text-blue-500";
    case "defective":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};