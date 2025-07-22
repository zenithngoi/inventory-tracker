import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  TruckIcon,
  Plus,
  SearchIcon,
  ArrowUpDown,
  RefreshCcw,
  Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryTransfers } from "@/hooks/use-inventory-transfers";
import { useAuthLocal as useAuth } from "@/hooks/use-auth-local";
import { formatDate } from "@/lib/utils";
import TransferRequestDialog from "@/components/transfer-request-dialog";
import TransferDetailDialog from "@/components/transfer-detail-dialog";
import { InventoryTransfer, TransferStatus } from "@/types/transfer";

export default function TransfersPage() {
  const { transfers, refreshTransfers, isLoading } = useInventoryTransfers();
  const { user } = useAuth();

  // UI State
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<InventoryTransfer | null>(null);
  const [isTransferDetailOpen, setIsTransferDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "all-statuses">("all-statuses");
  const [roleFilter, setRoleFilter] = useState<"all-transfers" | "source" | "destination">("all-transfers");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryTransfer | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "desc",
  });

  // Load transfers on initial render
  useEffect(() => {
    refreshTransfers();
  }, [refreshTransfers]);

  const handleSort = (key: keyof InventoryTransfer) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters and sort to transfers
  const filteredTransfers = transfers
    .filter((transfer) => {
      // Status filter
      if (statusFilter !== "all-statuses" && transfer.status !== statusFilter) {
        return false;
      }

      // Role filter (source or destination)
      if (roleFilter === "source" && transfer.sourceLocationId !== user?.franchise_id) {
        return false;
      }
      if (roleFilter === "destination" && transfer.destinationLocationId !== user?.franchise_id) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transfer.id.toLowerCase().includes(searchLower) ||
          transfer.sourceLocationName.toLowerCase().includes(searchLower) ||
          transfer.destinationLocationName.toLowerCase().includes(searchLower) ||
          transfer.reason.toLowerCase().includes(searchLower) ||
          (transfer.notes && transfer.notes.toLowerCase().includes(searchLower))
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) {
        // Default sort by createdAt
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      const key = sortConfig.key;
      
      if (key === 'createdAt' || key === 'updatedAt') {
        const result = new Date(a[key]).getTime() - new Date(b[key]).getTime();
        return sortConfig.direction === "asc" ? result : -result;
      }
      
      if (typeof a[key] === 'string' && typeof b[key] === 'string') {
        const result = (a[key] as string).localeCompare(b[key] as string);
        return sortConfig.direction === "asc" ? result : -result;
      }
      
      return 0;
    });

  // Group transfers by status
  const pendingTransfers = transfers.filter((t) => t.status === "pending");
  const approvedTransfers = transfers.filter((t) => t.status === "approved");
  const completedTransfers = transfers.filter(
    (t) => t.status === "completed" || t.status === "rejected" || t.status === "cancelled"
  );

  // Status badge color
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

  // Transfer direction badge
  const getTransferDirectionBadge = (transfer: InventoryTransfer) => {
    if (user?.franchise_id === transfer.sourceLocationId) {
      return <Badge variant="secondary">Outgoing</Badge>;
    } else if (user?.franchise_id === transfer.destinationLocationId) {
      return <Badge variant="secondary">Incoming</Badge>;
    }
    return null;
  };

  // Handle transfer click
  const handleTransferClick = (transfer: InventoryTransfer) => {
    setSelectedTransfer(transfer);
    setIsTransferDetailOpen(true);
  };

  // Refresh transfers
  const handleRefresh = () => {
    refreshTransfers();
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <TruckIcon className="h-8 w-8" />
            Inventory Transfers
          </h1>
          <p className="text-muted-foreground">
            Manage inventory transfers between locations
          </p>
        </div>

        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsTransferDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="md:col-span-6 lg:col-span-4">
          <div className="flex items-center space-x-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="status-filter" className="sr-only">
              Filter by Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value: TransferStatus | "all") => setStatusFilter(value)}
            >
              <SelectTrigger id="status-filter" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="role-filter" className="sr-only">
              Filter by Role
            </Label>
            <Select
              value={roleFilter}
              onValueChange={(value: "all-transfers" | "source" | "destination") => setRoleFilter(value)}
            >
              <SelectTrigger id="role-filter" className="w-full">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Role</SelectLabel>
                  <SelectItem value="all-transfers">All Transfers</SelectItem>
                  <SelectItem value="source">Outgoing</SelectItem>
                  <SelectItem value="destination">Incoming</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="all">
            All Transfers ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({completedTransfers.length})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "history"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  {tabValue === "all" && "All Transfers"}
                  {tabValue === "pending" && "Pending Approval"}
                  {tabValue === "approved" && "Ready for Completion"}
                  {tabValue === "history" && "Transfer History"}
                </CardTitle>
                <CardDescription>
                  {tabValue === "all" && "Complete list of all inventory transfers"}
                  {tabValue === "pending" && "Transfers waiting for approval"}
                  {tabValue === "approved" && "Approved transfers ready to be completed"}
                  {tabValue === "history" && "Completed, rejected and cancelled transfers"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTransfers.length === 0 ? (
                  <div className="text-center py-10">
                    <TruckIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No transfers found</p>
                    {statusFilter !== "all" || roleFilter !== "all" || searchTerm ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your filters
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        Create a new transfer to get started
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">
                            <div 
                              className="flex items-center cursor-pointer" 
                              onClick={() => handleSort('createdAt')}
                            >
                              Date
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>
                            <div 
                              className="flex items-center cursor-pointer"
                              onClick={() => handleSort('status')}
                            >
                              Status
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right">Direction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransfers
                          .filter((transfer) => {
                            if (tabValue === "all") return true;
                            if (tabValue === "pending") return transfer.status === "pending";
                            if (tabValue === "approved") return transfer.status === "approved";
                            if (tabValue === "history") {
                              return ["completed", "rejected", "cancelled"].includes(
                                transfer.status
                              );
                            }
                            return true;
                          })
                          .map((transfer) => (
                            <TableRow
                              key={transfer.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleTransferClick(transfer)}
                            >
                              <TableCell className="font-medium">
                                {formatDate(transfer.createdAt)}
                              </TableCell>
                              <TableCell>{transfer.sourceLocationName}</TableCell>
                              <TableCell>{transfer.destinationLocationName}</TableCell>
                              <TableCell>{transfer.items.length}</TableCell>
                              <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                              <TableCell className="text-right">
                                {getTransferDirectionBadge(transfer)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Transfer Request Dialog */}
      <TransferRequestDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
      />

      {/* Transfer Detail Dialog */}
      <TransferDetailDialog
        transfer={selectedTransfer}
        open={isTransferDetailOpen}
        onOpenChange={setIsTransferDetailOpen}
      />
    </div>
  );
}