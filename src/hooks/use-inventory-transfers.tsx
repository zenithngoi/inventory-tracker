import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorageFallback } from "@/hooks/use-local-storage-fallback";
import { TransferStatus, TransferItem, TransferRequest } from "@/types/transfer";

export function useInventoryTransfers() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { getItems, setItems, removeItem } = useLocalStorageFallback();

  // Event listeners for online status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  // Fetch all transfers
  const { data: transfers = [], isLoading, error, refetch } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      if (!isOnline) {
        // Use local storage if offline
        return getItems("transfers") || [];
      }
      
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Update local storage with latest data
      setItems("transfers", data);
      return data;
    },
    enabled: !!user,
  });
  
  // Create new transfer
  const createTransfer = useMutation({
    mutationFn: async (transferData: {
      sourceLocationId: string;
      destinationLocationId: string;
      items: TransferItem[];
      notes?: string;
    }) => {
      const newTransfer: TransferRequest = {
        id: uuidv4(),
        source_location_id: transferData.sourceLocationId,
        destination_location_id: transferData.destinationLocationId,
        requested_by_user_id: user?.id || "unknown",
        status: "pending" as TransferStatus,
        items: transferData.items,
        notes: transferData.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (!isOnline) {
        // Store locally if offline
        const currentTransfers = getItems("transfers") || [];
        setItems("transfers", [newTransfer, ...currentTransfers]);
        return newTransfer;
      }
      
      const { data, error } = await supabase
        .from("transfers")
        .insert(newTransfer)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer request created successfully");
    },
    onError: (error) => {
      console.error("Error creating transfer:", error);
      toast.error("Failed to create transfer request");
    },
  });

  // Approve transfer
  const approveTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      if (!isOnline) {
        // Handle offline approval (queue for later)
        const currentTransfers = getItems("transfers") || [];
        const updatedTransfers = currentTransfers.map((t: TransferRequest) =>
          t.id === transferId ? { ...t, status: "approved", updated_at: new Date().toISOString() } : t
        );
        setItems("transfers", updatedTransfers);
        
        // Queue the action for sync
        const pendingActions = getItems("pendingActions") || [];
        setItems("pendingActions", [...pendingActions, { action: "approveTransfer", id: transferId }]);
        return { id: transferId };
      }
      
      const { data, error } = await supabase
        .from("transfers")
        .update({
          status: "approved" as TransferStatus,
          approved_by_user_id: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transferId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer approved successfully");
    },
    onError: (error) => {
      console.error("Error approving transfer:", error);
      toast.error("Failed to approve transfer");
    },
  });

  // Reject transfer
  const rejectTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      if (!isOnline) {
        // Handle offline rejection (queue for later)
        const currentTransfers = getItems("transfers") || [];
        const updatedTransfers = currentTransfers.map((t: TransferRequest) =>
          t.id === transferId ? { ...t, status: "rejected", updated_at: new Date().toISOString() } : t
        );
        setItems("transfers", updatedTransfers);
        
        // Queue the action for sync
        const pendingActions = getItems("pendingActions") || [];
        setItems("pendingActions", [...pendingActions, { action: "rejectTransfer", id: transferId }]);
        return { id: transferId };
      }
      
      const { data, error } = await supabase
        .from("transfers")
        .update({
          status: "rejected" as TransferStatus,
          approved_by_user_id: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transferId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer rejected successfully");
    },
    onError: (error) => {
      console.error("Error rejecting transfer:", error);
      toast.error("Failed to reject transfer");
    },
  });

  // Sync pending actions when back online
  const syncPendingActions = async () => {
    if (!isOnline) return;
    
    const pendingActions = getItems("pendingActions") || [];
    if (!pendingActions.length) return;
    
    toast.info("Syncing pending actions...");
    
    try {
      for (const action of pendingActions) {
        if (action.action === "approveTransfer") {
          await approveTransfer.mutateAsync(action.id);
        } else if (action.action === "rejectTransfer") {
          await rejectTransfer.mutateAsync(action.id);
        }
      }
      
      // Clear pending actions
      setItems("pendingActions", []);
      toast.success("All pending actions synced successfully");
    } catch (error) {
      console.error("Error syncing pending actions:", error);
      toast.error("Failed to sync some pending actions");
    }
  };

  return {
    transfers,
    isLoading,
    error,
    refetch,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    syncPendingActions,
    isOnline,
  };
}