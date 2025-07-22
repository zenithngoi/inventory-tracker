import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/header";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ManualBarcodeInput } from "@/components/manual-barcode-input";
import { Button } from "@/components/ui/button";
import { ItemDetailDialog } from "@/components/item-detail-dialog";
import { ItemFormDialog } from "@/components/item-form-dialog";
import { StatusUpdateDialog } from "@/components/status-update-dialog";
import { useInventory } from "@/hooks/use-inventory";
import { useInventoryTransfers } from "@/hooks/use-inventory-transfers"; 
import { useToast } from "@/components/ui/use-toast";
import { InventoryItem, ItemStatus } from "@/types";
import { TransferItem } from "@/types/transfer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Keyboard, ArrowLeft, Package, PackageX, TruckIcon, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TransferRequestDialog from "@/components/transfer-request-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ScanPage() {
  const navigate = useNavigate();
  const { items, addItem, changeItemStatus, getItemByBarcode } = useInventory();
  const { toast } = useToast();

  // Scanning state
  const [scanMode, setScanMode] = useState<"single" | "batch">("single");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [isItemFound, setIsItemFound] = useState<boolean | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  
  // Dialogs state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  
  // Status change state
  const [itemToChangeStatus, setItemToChangeStatus] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ItemStatus | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Batch scanning state
  const [batchItems, setBatchItems] = useState<TransferItem[]>([]);
  const [batchMode, setBatchMode] = useState<"import" | "transfer">("import");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [importLocation, setImportLocation] = useState("");

  // Handle barcode scan result
  const handleScan = (barcode) => {
    setScannedBarcode(barcode);
    
    if (scanMode === "single") {
      // Single item mode
      const item = getItemByBarcode(barcode);
      
      if (item) {
        setScannedItem(item);
        setIsItemFound(true);
        setIsScannerOpen(false);
      } else {
        setScannedItem(null);
        setIsItemFound(false);
        setIsScannerOpen(false);
      }
    } else {
      // Batch mode
      const item = getItemByBarcode(barcode);
      
      if (item) {
        // Check if item already in batch
        const existingIndex = batchItems.findIndex(i => i.barcode === barcode);
        
        if (existingIndex >= 0) {
          // Update quantity if item already exists
          const updatedItems = [...batchItems];
          updatedItems[existingIndex].quantity += currentQuantity;
          setBatchItems(updatedItems);
        } else {
          // Add new item to batch
          const newBatchItem: TransferItem = {
            id: crypto.randomUUID(),
            itemId: item.id,
            barcode: item.barcode,
            name: item.name,
            quantity: currentQuantity
          };
          
          setBatchItems([...batchItems, newBatchItem]);
        }
        
        toast({
          title: "Item added to batch",
          description: `${item.name} (${currentQuantity} units) added to batch`,
        });
        
        // Keep scanner open for continuous scanning
        setScannedBarcode(null);
      } else {
        toast({
          title: "Item not found",
          description: `No item found with barcode ${barcode}`,
          variant: "destructive",
        });
      }
    }
  };

  // Handle adding a new item
  const handleAddItem = (newItem) => {
    addItem({
      barcode: scannedBarcode || newItem.barcode || "",
      name: newItem.name || "",
      status: newItem.status || "imported",
      location: newItem.location || "",
      category: newItem.category || "",
      importDate: new Date().toISOString(),
      notes: newItem.notes,
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to inventory.`,
    });
    // Reset the state
    setScannedBarcode(null);
    setIsItemFound(null);
  };

  // Handle item status change request
  const handleStatusChangeRequest = (status) => {
    if (scannedItem) {
      setItemToChangeStatus(scannedItem.id);
      setNewStatus(status);
      setIsStatusDialogOpen(true);
    }
  };

  // Handle status change confirmation
  const handleStatusChange = (notes) => {
    if (itemToChangeStatus && newStatus) {
      changeItemStatus(itemToChangeStatus, newStatus, "User", notes);
      setIsStatusDialogOpen(false);
      
      // Update the scanned item with the new status
      const updatedItem = items.find(item => item.id === itemToChangeStatus);
      if (updatedItem) {
        setScannedItem(updatedItem);
      }
      
      toast({
        title: "Status Updated",
        description: `Item is now marked as ${newStatus}.`,
      });
    }
  };

  // Reset scan state
  const resetScan = () => {
    setScannedItem(null);
    setIsItemFound(null);
    setScannedBarcode(null);
  };

  // Remove item from batch
  const removeFromBatch = (id: string) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  // Clear entire batch
  const clearBatch = () => {
    if (window.confirm('Are you sure you want to clear all items from the batch?')) {
      setBatchItems([]);
    }
  };

  // Process batch for import or transfer
  const processBatch = () => {
    if (batchMode === "import") {
      // Handle importing multiple items
      toast({
        title: "Batch Import",
        description: `${batchItems.length} items have been imported to ${importLocation || 'inventory'}`,
      });
      // TODO: Actually process the imported items
      setBatchItems([]);
    } else {
      // Open transfer dialog
      setIsTransferDialogOpen(true);
    }
  };

  // Determine if the batch has items to process
  const canProcessBatch = batchItems.length > 0 && (
    batchMode !== "import" || importLocation.length > 0
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Barcode Scanner</h1>
        </div>

        {/* Scan Mode Selector */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="scanMode">Scan Mode</Label>
            <Select 
              value={scanMode}
              onValueChange={(value: "single" | "batch") => {
                setScanMode(value);
                resetScan();
                setIsScannerOpen(false);
              }}
            >
              <SelectTrigger id="scanMode">
                <SelectValue placeholder="Select scan mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Item Scan</SelectItem>
                <SelectItem value="batch">Batch Scan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {scanMode === "single" ? (
          // SINGLE SCAN MODE
          <>
            {isScannerOpen ? (
              <BarcodeScanner
                onScan={handleScan}
                onClose={() => setIsScannerOpen(false)}
              />
            ) : isItemFound === null ? (
              <div className="max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Scan Inventory Item</CardTitle>
                    <CardDescription>
                      Scan a barcode to find or add an item to inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="camera" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="camera" className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Camera
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                          <Keyboard className="h-4 w-4" />
                          Manual
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="camera" className="mt-4">
                        <Button
                          onClick={() => setIsScannerOpen(true)}
                          className="w-full"
                        >
                          Open Camera Scanner
                        </Button>
                      </TabsContent>
                      <TabsContent value="manual" className="mt-4">
                        <ManualBarcodeInput onSubmit={handleScan} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : isItemFound ? (
              <div className="max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Item Found</CardTitle>
                    <CardDescription>
                      Barcode: {scannedItem?.barcode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                        <p className="font-medium">{scannedItem?.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                        <p className="font-medium capitalize">{scannedItem?.status}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                        <p>{scannedItem?.location}</p>
                      </div>
                      <div className="pt-2">
                        <h3 className="font-medium mb-2">Update Status:</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={scannedItem?.status === "imported" ? "outline" : "secondary"}
                            onClick={() => handleStatusChangeRequest("imported")}
                            disabled={scannedItem?.status === "imported"}
                            className="flex-1"
                          >
                            Imported
                          </Button>
                          <Button
                            variant={scannedItem?.status === "sold" ? "outline" : "secondary"}
                            onClick={() => handleStatusChangeRequest("sold")}
                            disabled={scannedItem?.status === "sold"}
                            className="flex-1"
                          >
                            Sold
                          </Button>
                          <Button
                            variant={scannedItem?.status === "defective" ? "outline" : "secondary"}
                            onClick={() => handleStatusChangeRequest("defective")}
                            disabled={scannedItem?.status === "defective"}
                            className="flex-1"
                          >
                            Defective
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            variant={scannedItem?.status === "in_transit" ? "outline" : "secondary"}
                            onClick={() => handleStatusChangeRequest("in_transit")}
                            disabled={scannedItem?.status === "in_transit"}
                            className="flex-1"
                          >
                            In Transit
                          </Button>
                          <Button
                            variant={scannedItem?.status === "returned" ? "outline" : "secondary"}
                            onClick={() => handleStatusChangeRequest("returned")}
                            disabled={scannedItem?.status === "returned"}
                            className="flex-1"
                          >
                            Returned
                          </Button>
                          <Button
                            variant={scannedItem?.status === "pending_transfer" ? "outline" : "secondary"}
                            onClick={() => handleStatusChangeRequest("pending_transfer")}
                            disabled={scannedItem?.status === "pending_transfer"}
                            className="flex-1"
                          >
                            Pending Transfer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={resetScan}>
                      Scan Another
                    </Button>
                    <Button onClick={() => setIsViewDialogOpen(true)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-600">Item Not Found</CardTitle>
                    <CardDescription>
                      Barcode: {scannedBarcode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4">
                      This barcode is not in your inventory. Would you like to add it?
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={resetScan}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      Add New Item
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </>
        ) : (
          // BATCH SCAN MODE
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Batch Scanning</CardTitle>
                <CardDescription>
                  Scan multiple items for bulk processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="batchMode">Batch Mode</Label>
                      <Select
                        value={batchMode}
                        onValueChange={(value: "import" | "transfer") => {
                          setBatchMode(value as "import" | "transfer");
                        }}
                      >
                        <SelectTrigger id="batchMode">
                          <SelectValue placeholder="Select batch mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">Import Items</SelectItem>
                          <SelectItem value="transfer">Transfer Items</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {batchMode === "import" && (
                      <div>
                        <Label htmlFor="importLocation">Import Location</Label>
                        <Input
                          id="importLocation"
                          value={importLocation}
                          onChange={(e) => setImportLocation(e.target.value)}
                          placeholder="Enter storage location"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="quantity">Item Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <Label className="mb-2">Scanner</Label>
                    {isScannerOpen ? (
                      <BarcodeScanner
                        onScan={handleScan}
                        onClose={() => setIsScannerOpen(false)}
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setIsScannerOpen(true)}
                          className="w-full"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Open Camera Scanner
                        </Button>
                        <ManualBarcodeInput onSubmit={handleScan} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Batch Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Scanned Items ({batchItems.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearBatch}
                      disabled={batchItems.length === 0}
                    >
                      <PackageX className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      onClick={processBatch}
                      disabled={!canProcessBatch}
                    >
                      {batchMode === "import" ? (
                        <>
                          <Package className="h-4 w-4 mr-1" />
                          Import Batch
                        </>
                      ) : (
                        <>
                          <TruckIcon className="h-4 w-4 mr-1" />
                          Create Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {batchMode === "import" 
                    ? "Items to be imported into inventory" 
                    : "Items to be transferred between locations"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batchItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No items have been scanned yet.</p>
                    <p className="text-sm">Begin scanning barcodes to add items to this batch.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="font-mono text-xs">{item.barcode}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromBatch(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* View Item Dialog */}
      <ItemDetailDialog
        item={scannedItem}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
      
      {/* Add Item Dialog */}
      <ItemFormDialog
        title="Add New Item"
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddItem}
      />
      
      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        onUpdate={handleStatusChange}
        status={newStatus || "imported"}
      />
      
      {/* Transfer Request Dialog */}
      <TransferRequestDialog
        open={isTransferDialogOpen}
        onOpenChange={(open) => {
          setIsTransferDialogOpen(open);
          if (!open) {
            // If dialog was closed after successful creation, clear the batch
            setBatchItems([]);
          }
        }}
      />
    </div>
  );
}