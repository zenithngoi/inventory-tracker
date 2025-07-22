import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ItemStatus } from "@/types";

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (notes: string) => void;
  status: ItemStatus;
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  onUpdate,
  status,
}: StatusUpdateDialogProps) {
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(notes);
    setNotes("");
  };

  const getStatusTitle = () => {
    switch (status) {
      case "imported":
        return "Mark as Imported";
      case "sold":
        return "Mark as Sold";
      case "defective":
        return "Mark as Defective";
      default:
        return "Update Status";
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "imported":
        return "Add notes about the item being imported or returned to inventory.";
      case "sold":
        return "Add notes about the sale, such as customer information or sale conditions.";
      case "defective":
        return "Add notes about the defect, such as the type of damage or issue.";
      default:
        return "Add notes about this status change.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getStatusTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              {getStatusDescription()}
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Optional notes about this status change"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Status</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}