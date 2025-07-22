import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { InventoryItem } from "@/types";
import { formatDate, getStatusColor } from "@/lib/utils";

interface ItemDetailDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailDialog({ 
  item, 
  open, 
  onOpenChange 
}: ItemDetailDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Barcode</h3>
            <p className="font-mono">{item.barcode}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
            <p>{item.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
            <Badge className={`${getStatusColor(item.status)} text-white mt-1`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
            <p>{item.location}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
            <p>{item.category}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Import Date</h3>
            <p>{formatDate(item.importDate)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
            <p>{formatDate(item.lastUpdated)}</p>
          </div>
          {item.notes && (
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="text-sm">{item.notes}</p>
            </div>
          )}
        </div>

        <Separator />
        
        <h3 className="text-sm font-medium my-2">Status History</h3>
        <ScrollArea className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status Change</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No history available
                  </TableCell>
                </TableRow>
              ) : (
                // Display in reverse chronological order
                [...item.history].reverse().map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      {entry.previousStatus ? (
                        <span>
                          {entry.previousStatus.charAt(0).toUpperCase() + entry.previousStatus.slice(1)}
                          {" → "}
                          {entry.newStatus.charAt(0).toUpperCase() + entry.newStatus.slice(1)}
                        </span>
                      ) : (
                        <span>Initial: {entry.newStatus.charAt(0).toUpperCase() + entry.newStatus.slice(1)}</span>
                      )}
                    </TableCell>
                    <TableCell>{entry.updatedBy}</TableCell>
                    <TableCell>{entry.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}