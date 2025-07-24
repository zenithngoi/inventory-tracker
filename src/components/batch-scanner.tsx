import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ManualBarcodeInput } from "@/components/manual-barcode-input";
import { TransferItem } from "@/types/transfer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Camera, Trash2, Scan, PackageX } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/lib/i18n/context";

interface BatchScannerProps {
  items: TransferItem[];
  onItemsChange: (items: TransferItem[]) => void;
  maxItems?: number;
  allowDuplicates?: boolean;
}

export default function BatchScanner({
  items,
  onItemsChange,
  maxItems = 100,
  allowDuplicates = true,
}: BatchScannerProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    // Check if we reached the maximum number of items
    if (items.length >= maxItems && !allowDuplicates) {
      toast({
        title: t('common.error'),
        description: t('common.maxItemsReached', { max: maxItems }),
        variant: "destructive",
      });
      return;
    }

    // Use scanned barcode as item name if no lookup
    const itemName = barcode;
    
    // Check if item already exists in the batch
    const existingIndex = items.findIndex(i => i.barcode === barcode);
    
    if (existingIndex >= 0 && allowDuplicates) {
      // Update quantity if item already exists
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += currentQuantity;
      onItemsChange(updatedItems);
      toast({
        title: t('common.quantityUpdated'),
        description: `${itemName}: ${updatedItems[existingIndex].quantity}`,
      });
    } else if (existingIndex >= 0 && !allowDuplicates) {
      toast({
        title: t('common.error'),
        description: t('common.itemAlreadyAdded'),
        variant: "destructive",
      });
    } else {
      // Add new item to batch
      const newBatchItem: TransferItem = {
        id: uuidv4(),
        itemId: barcode,
        barcode: barcode,
        name: itemName,
        quantity: currentQuantity
      };
      onItemsChange([...items, newBatchItem]);
      toast({
        title: t('common.itemAdded'),
        description: `${itemName} (${currentQuantity})`,
      });
    }
  };

  // Remove item from batch
  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    onItemsChange(
      items.map(item => 
        item.id === id 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Clear all items
  const clearAllItems = () => {
    if (window.confirm('Are you sure you want to clear all scanned items?')) {
      onItemsChange([]);
    }
  };

  return (
    <div className="space-y-6">
      {isScannerOpen ? (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsScannerOpen(false)}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2 flex flex-col">
              <Label>Scanning</Label>
              <div className="flex gap-2 mt-1 flex-1">
                <Button 
                  onClick={() => setIsScannerOpen(true)}
                  className="flex-1 text-lg py-4"
                >
                  <Camera className="mr-2 h-6 w-6" />
                  {t('common.openCamera')}
                </Button>
                <ManualBarcodeInput 
                  onSubmit={handleBarcodeScan} 
                  buttonLabel={t('common.add')}
                  buttonIcon={<Scan className="h-6 w-6" />}
                  className="flex-1 text-lg py-4"
                />
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">
                {t('common.scannedItems')} {items.length > 0 ? `(${items.length})` : ""}
              </h3>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={clearAllItems}
                  className="h-12"
                >
                  <PackageX className="h-6 w-6 mr-1" />
                  {t('common.clearAll')}
                </Button>
              )}
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-8 border rounded-md bg-muted/30">
                <p className="text-lg text-muted-foreground">
                  {t('common.noItemsScanned')}
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden md:table-cell">Barcode</TableHead>
                      <TableHead className="w-[100px] text-center">Qty</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{item.barcode}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <div className="h-8 px-2 flex items-center justify-center border-y">
                              {item.quantity}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 float-right"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}