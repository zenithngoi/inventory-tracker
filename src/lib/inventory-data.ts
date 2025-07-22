import { InventoryItem } from "@/types";

// Mock data for local storage initialization
export const initialInventoryData: InventoryItem[] = [
  {
    id: "1",
    barcode: "1234567890123",
    name: "Product A",
    status: "imported",
    location: "Warehouse A",
    category: "Electronics",
    importDate: new Date(2025, 6, 10).toISOString(),
    lastUpdated: new Date(2025, 6, 10).toISOString(),
    history: [
      {
        id: "h1",
        date: new Date(2025, 6, 10).toISOString(),
        newStatus: "imported",
        updatedBy: "System",
      },
    ],
  },
  {
    id: "2",
    barcode: "2345678901234",
    name: "Product B",
    status: "sold",
    location: "Warehouse B",
    category: "Furniture",
    importDate: new Date(2025, 6, 5).toISOString(),
    lastUpdated: new Date(2025, 6, 12).toISOString(),
    history: [
      {
        id: "h2",
        date: new Date(2025, 6, 5).toISOString(),
        newStatus: "imported",
        updatedBy: "System",
      },
      {
        id: "h3",
        date: new Date(2025, 6, 12).toISOString(),
        previousStatus: "imported",
        newStatus: "sold",
        updatedBy: "System",
        notes: "Sold to customer #12345",
      },
    ],
  },
  {
    id: "3",
    barcode: "3456789012345",
    name: "Product C",
    status: "defective",
    location: "Warehouse A",
    category: "Clothing",
    importDate: new Date(2025, 6, 1).toISOString(),
    lastUpdated: new Date(2025, 6, 8).toISOString(),
    notes: "Damage during shipping",
    history: [
      {
        id: "h4",
        date: new Date(2025, 6, 1).toISOString(),
        newStatus: "imported",
        updatedBy: "System",
      },
      {
        id: "h5",
        date: new Date(2025, 6, 8).toISOString(),
        previousStatus: "imported",
        newStatus: "defective",
        updatedBy: "System",
        notes: "Damage during shipping",
      },
    ],
  },
];

export const categoryOptions = [
  { id: "1", name: "Electronics" },
  { id: "2", name: "Furniture" },
  { id: "3", name: "Clothing" },
  { id: "4", name: "Food & Beverage" },
  { id: "5", name: "Office Supplies" },
];

export const locationOptions = [
  { id: "1", name: "Warehouse A" },
  { id: "2", name: "Warehouse B" },
  { id: "3", name: "Store Front" },
  { id: "4", name: "Back Office" },
];