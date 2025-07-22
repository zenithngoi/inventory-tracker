import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { TransferItem } from "@/types/transfer";
import { useInventoryTransfers } from "@/hooks/use-inventory-transfers";
import { useAuthLocal as useAuth } from "@/hooks/use-auth-local";
import BatchScanner from "@/components/batch-scanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TransferRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preloadedItems?: TransferItem[];
}

export default function TransferRequestDialog({
  open,
  onOpenChange,
  preloadedItems = []
}: TransferRequestDialogProps) {
  const { toast } = useToast();
  const { createTransferRequest, isLoading } = useInventoryTransfers();
  const { user, franchises } = useAuth();
  
  const [selectedDestination, setSelectedDestination] = useState<string | undefined>(undefined);
  const [transferType, setTransferType] = useState("regular");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  
  // Reset form when dialog opens and apply any preloaded items
  useEffect(() => {
    if (open) {
      setItems(preloadedItems || []);
      setSelectedDestination(undefined);
      setTransferType("regular");
      setReason("");
      setNotes("");
    }
  }, [open, preloadedItems]);
  
  // Get available destinations (exclude current location)
  const availableDestinations = franchises
    .filter(franchise => franchise.id !== user?.franchise_id)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const handleSubmit = async () => {
    if (!selectedDestination) {
      toast({
        title: "Destination required",
        description: "Please select a destination location",
        variant: "destructive",
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "No items added",
        description: "Please add at least one item to the transfer",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createTransferRequest({
        sourceLocationId: user?.franchise_id || "",
        destinationLocationId: selectedDestination,
        transferType: transferType as "regular" | "return" | "loan",
        reason,
        notes,
        items
      });
      
      toast({
        title: "Transfer request created",
        description: "The transfer request has been successfully created",
      });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error creating transfer",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Inventory Transfer</DialogTitle>
          <DialogDescription>
            Create a new inventory transfer request to move items between locations
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Transfer Details</TabsTrigger>
            <TabsTrigger value="items">Scan Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Select
                value={selectedDestination}
                onValueChange={setSelectedDestination}
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="transferType">Transfer Type</Label>
              <Select
                value={transferType}
                onValueChange={setTransferType}
              >
                <SelectTrigger id="transferType">
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Transfer</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Transfer</Label>
              <Input
                id="reason"
                placeholder="Why is this transfer needed?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or details..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Items in Transfer: {items.length}</p>
              {items.length > 0 ? (
                <div className="text-sm text-muted-foreground">
                  {items.length} item(s) added to this transfer. Switch to the "Scan Items" tab to add or remove items.
                </div>
              ) : (
                <div className="text-sm text-amber-600">
                  No items added yet. Please go to the "Scan Items" tab to add items to this transfer.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="items">
            <BatchScanner 
              items={items} 
              onItemsChange={setItems} 
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Transfer Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}