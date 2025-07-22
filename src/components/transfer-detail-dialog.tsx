import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { InventoryTransfer, TransferItem, TransferStatus } from "@/types/transfer";
import { useInventoryTransfers } from "@/hooks/use-inventory-transfers";
import { useAuthLocal as useAuth } from "@/hooks/use-auth-local";
import { CheckCircle2, XCircle, ArrowRightLeft, TruckIcon, AlertCircle } from "lucide-react";

interface TransferDetailDialogProps {
  transfer: InventoryTransfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransferDetailDialog({
  transfer,
  open,
  onOpenChange
}: TransferDetailDialogProps) {
  const { toast } = useToast();
  const { approveTransfer, rejectTransfer, completeTransfer, isLoading } = useInventoryTransfers();
  const { user } = useAuth();

  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  // Reset states when dialog opens
  if (!transfer) {
    return null;
  }

  const isSource = transfer.sourceLocationId === user?.franchise_id;
  const isDestination = transfer.destinationLocationId === user?.franchise_id;

  // Determine available actions based on transfer status and user role
  const canApprove = transfer.status === "pending" && isDestination;
  const canReject = transfer.status === "pending" && isDestination;
  const canComplete = transfer.status === "approved" && isDestination;

  const handleApprove = async () => {
    if (!transfer) return;
    
    try {
      await approveTransfer({
        transferId: transfer.id,
        notes,
      });
      
      toast({
        title: "Transfer approved",
        description: "The transfer has been approved successfully",
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error approving transfer",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!transfer) return;
    
    if (!notes) {
      toast({
        title: "Notes required",
        description: "Please provide a reason for rejecting this transfer",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await rejectTransfer({
        transferId: transfer.id,
        notes,
      });
      
      toast({
        title: "Transfer rejected",
        description: "The transfer has been rejected successfully",
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error rejecting transfer",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (!transfer) return;
    
    // Get selected items
    const acceptedItems = transfer.items
      .filter(item => selectedItems[item.id])
      .map(item => ({
        id: item.id,
        quantity: item.quantity
      }));
    
    if (acceptedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to complete the transfer",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await completeTransfer({
        transferId: transfer.id,
        notes,
        acceptedItems,
      });
      
      toast({
        title: "Transfer completed",
        description: "The transfer has been completed successfully",
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error completing transfer",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Toggle all items
  const toggleAllItems = (checked: boolean) => {
    const newSelectedItems: Record<string, boolean> = {};
    transfer.items.forEach(item => {
      newSelectedItems[item.id] = checked;
    });
    setSelectedItems(newSelectedItems);
  };

  // Toggle individual item
  const toggleItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };
  
  // Check if all items are selected
  const areAllItemsSelected = transfer.items.length > 0 && 
    transfer.items.every(item => selectedItems[item.id]);

  // Get status badge
  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Transfer Details
          </DialogTitle>
          <DialogDescription>
            View and manage transfer information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>Transfer Information</CardTitle>
                {getStatusBadge(transfer.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Transfer ID</p>
                  <p className="text-sm text-muted-foreground font-mono">{transfer.id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Created On</p>
                  <p className="text-sm text-muted-foreground">{formatDate(transfer.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">From</p>
                  <p className="text-sm text-muted-foreground">{transfer.sourceLocationName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">To</p>
                  <p className="text-sm text-muted-foreground">{transfer.destinationLocationName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Type</p>
                  <p className="text-sm text-muted-foreground capitalize">{transfer.transferType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Items</p>
                  <p className="text-sm text-muted-foreground">{transfer.items.length} item(s)</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">Reason</p>
                <p className="text-sm text-muted-foreground">{transfer.reason || "No reason provided"}</p>
              </div>

              {transfer.notes && (
                <div className="mt-4">
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="text-sm text-muted-foreground">{transfer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transfer Items</h3>
              
              {canComplete && (
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all" 
                    checked={areAllItemsSelected}
                    onCheckedChange={(checked) => toggleAllItems(!!checked)}
                  />
                  <Label htmlFor="select-all" className="text-sm">Select All</Label>
                </div>
              )}
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canComplete && <TableHead className="w-[40px]"></TableHead>}
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden md:table-cell">Barcode</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfer.items.map((item) => (
                    <TableRow key={item.id}>
                      {canComplete && (
                        <TableCell>
                          <Checkbox 
                            checked={!!selectedItems[item.id]}
                            onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{item.barcode}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {(canApprove || canReject || canComplete) && (
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder={
                  canApprove ? "Additional notes for approval..." :
                  canReject ? "Reason for rejecting this transfer..." :
                  "Notes for completing this transfer..."
                }
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          <Separator />
          
          {/* Status history */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Transfer History</h3>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
                <div>
                  <p><span className="font-medium">Created</span> on {formatDate(transfer.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">From {transfer.sourceLocationName} to {transfer.destinationLocationName}</p>
                </div>
              </div>

              {transfer.status !== "pending" && transfer.statusHistory && transfer.statusHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-2 mt-2">
                  <div className="mt-1">
                    <div className={`h-2 w-2 rounded-full ${
                      entry.status === "approved" ? "bg-green-500" : 
                      entry.status === "rejected" ? "bg-red-500" : 
                      entry.status === "completed" ? "bg-green-700" : 
                      "bg-gray-500"
                    }`}></div>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium capitalize">{entry.status}</span> on {formatDate(entry.timestamp)}
                      {entry.userId && <span className="text-xs text-muted-foreground ml-1">by {entry.userId}</span>}
                    </p>
                    {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <div className="flex gap-2">
            {canReject && (
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            
            {canApprove && (
              <Button 
                variant="default" 
                onClick={handleApprove}
                disabled={isLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            
            {canComplete && (
              <Button 
                variant="default" 
                onClick={handleComplete}
                disabled={isLoading}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Complete Transfer
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}