import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { InventoryItem, ItemStatus } from "@/types";
import { formatDate, getStatusColor } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react";

interface InventoryTableProps {
  items: InventoryItem[];
  onView: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
  onStatusChange: (itemId: string, status: ItemStatus) => void;
}

export function InventoryTable({ 
  items, 
  onView, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: InventoryTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Barcode</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                No inventory items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.barcode}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(item.status)} text-white`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatDate(item.lastUpdated)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(item.id, "imported")}
                        disabled={item.status === "imported"}
                      >
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Mark as Imported
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(item.id, "sold")}
                        disabled={item.status === "sold"}
                      >
                        <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                        Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(item.id, "defective")}
                        disabled={item.status === "defective"}
                      >
                        <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                        Mark as Defective
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}