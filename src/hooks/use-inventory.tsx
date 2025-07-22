import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorageFallback } from "@/hooks/use-local-storage-fallback";
import { setupRealtimeSubscriptions } from "@/lib/supabase";

export interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  category_id: string;
  location_id: string;
  quantity: number;
  unit_price?: number;
  image_url?: string;
  status: "active" | "inactive" | "archived";
  created_at?: string;
  updated_at?: string;
}

export function useInventory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { getItems, setItems } = useLocalStorageFallback();

  // Set up realtime subscriptions on component mount
  useEffect(() => {
    if (user) {
      setupRealtimeSubscriptions();
    }
  }, [user]);

  // Event listeners for online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync data when coming back online
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  // Fetch all inventory items
  const {
    data: inventory = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!isOnline) {
        // Use local storage if offline
        return getItems("inventory") || [];
      }
      
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, categories(*), locations(*)")
        .order("name");
      
      if (error) throw error;
      
      // Update local storage with latest data for offline use
      setItems("inventory", data);
      return data;
    },
    enabled: !!user,
  });

  // Fetch item by barcode
  const getItemByBarcode = async (barcode: string) => {
    if (!isOnline) {
      const items = getItems("inventory") || [];
      return items.find((item: InventoryItem) => item.barcode === barcode);
    }
    
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*, categories(*), locations(*)")
      .eq("barcode", barcode)
      .single();
    
    if (error) return null;
    return data;
  };

  // Add inventory item
  const addItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "updated_at">) => {
      const newItem = {
        ...item,
        id: uuidv4(),
        user_id: user?.id
      };
      
      if (!isOnline) {
        // Store locally if offline
        const currentInventory = getItems("inventory") || [];
        setItems("inventory", [...currentInventory, newItem]);
        
        // Queue the action for sync
        const pendingActions = getItems("pendingActions") || [];
        setItems("pendingActions", [...pendingActions, { action: "addInventoryItem", item: newItem }]);
        
        return newItem;
      }
      
      const { data, error } = await supabase
        .from("inventory_items")
        .insert(newItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item added successfully");
    },
    onError: (error) => {
      console.error("Error adding inventory item:", error);
      toast.error("Failed to add inventory item");
    },
  });

  // Update inventory item
  const updateItem = useMutation({
    mutationFn: async (item: InventoryItem) => {
      const { id, ...updateData } = item;
      
      if (!isOnline) {
        // Update locally if offline
        const currentInventory = getItems("inventory") || [];
        const updatedInventory = currentInventory.map((i: InventoryItem) =>
          i.id === id ? { ...i, ...updateData, updated_at: new Date().toISOString() } : i
        );
        setItems("inventory", updatedInventory);
        
        // Queue the action for sync
        const pendingActions = getItems("pendingActions") || [];
        setItems("pendingActions", [...pendingActions, { action: "updateInventoryItem", item }]);
        
        return item;
      }
      
      const { data, error } = await supabase
        .from("inventory_items")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item updated successfully");
    },
    onError: (error) => {
      console.error("Error updating inventory item:", error);
      toast.error("Failed to update inventory item");
    },
  });

  // Delete inventory item (mark as archived)
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline) {
        // Update status locally if offline
        const currentInventory = getItems("inventory") || [];
        const updatedInventory = currentInventory.map((i: InventoryItem) =>
          i.id === id ? { ...i, status: "archived", updated_at: new Date().toISOString() } : i
        );
        setItems("inventory", updatedInventory);
        
        // Queue the action for sync
        const pendingActions = getItems("pendingActions") || [];
        setItems("pendingActions", [...pendingActions, { action: "deleteInventoryItem", id }]);
        
        return { id };
      }
      
      // We're just marking as archived, not actually deleting
      const { data, error } = await supabase
        .from("inventory_items")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item archived successfully");
    },
    onError: (error) => {
      console.error("Error archiving inventory item:", error);
      toast.error("Failed to archive inventory item");
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!isOnline) {
        return getItems("categories") || [];
      }
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      setItems("categories", data);
      return data;
    },
    enabled: !!user,
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      if (!isOnline) {
        return getItems("locations") || [];
      }
      
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      setItems("locations", data);
      return data;
    },
    enabled: !!user,
  });

  // Sync local changes when back online
  const syncPendingChanges = async () => {
    if (!isOnline) return;
    
    const pendingActions = getItems("pendingActions") || [];
    if (!pendingActions.length) return;
    
    toast.info("Syncing pending changes...");
    
    try {
      for (const action of pendingActions) {
        if (action.action === "addInventoryItem") {
          await addItem.mutateAsync(action.item);
        } else if (action.action === "updateInventoryItem") {
          await updateItem.mutateAsync(action.item);
        } else if (action.action === "deleteInventoryItem") {
          await deleteItem.mutateAsync(action.id);
        }
      }
      
      // Clear pending actions
      setItems("pendingActions", []);
      toast.success("All pending changes synced successfully");
    } catch (error) {
      console.error("Error syncing pending changes:", error);
      toast.error("Failed to sync some pending changes");
    }
  };

  return {
    inventory,
    categories,
    locations,
    isLoading,
    error,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    getItemByBarcode,
    isOnline,
    syncPendingChanges
  };
}