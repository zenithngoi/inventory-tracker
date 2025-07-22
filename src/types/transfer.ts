export type TransferStatus = "pending" | "approved" | "rejected" | "completed";

export interface TransferItem {
  id: string;
  barcode: string;
  name: string;
  quantity: number;
}

export interface TransferRequest {
  id: string;
  source_location_id: string;
  destination_location_id: string;
  requested_by_user_id: string;
  approved_by_user_id?: string;
  status: TransferStatus;
  items: TransferItem[];
  notes: string;
  created_at: string;
  updated_at: string;
}