import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [foundItem, setFoundItem] = useState<any | null>(null);

  // Simulate scanning a barcode
  const handleScan = () => {
    setIsScanning(true);
    
    // Simulate scanning process with a timeout
    setTimeout(() => {
      const randomCodes = [
        "4002359871", // Paper Towels
        "4002359872", // Hand Soap
        "4002359873", // Coffee Beans
        "4002359874", // Napkins
        "4002359875", // Sugar Packets
      ];
      
      const scannedCode = randomCodes[Math.floor(Math.random() * randomCodes.length)];
      setLastScannedCode(scannedCode);
      
      // Simulate looking up item data
      const items = [
        { barcode: "4002359871", name: "Paper Towels", category: "Supplies", quantity: 245, location: "Warehouse A" },
        { barcode: "4002359872", name: "Hand Soap", category: "Supplies", quantity: 120, location: "Warehouse B" },
        { barcode: "4002359873", name: "Coffee Beans", category: "Food", quantity: 50, location: "Warehouse A" },
        { barcode: "4002359874", name: "Napkins", category: "Supplies", quantity: 430, location: "Warehouse C" },
        { barcode: "4002359875", name: "Sugar Packets", category: "Food", quantity: 850, location: "Warehouse B" },
      ];
      
      const foundItem = items.find(item => item.barcode === scannedCode);
      setFoundItem(foundItem);
      
      toast.success(`Barcode scanned: ${scannedCode}`);
      setIsScanning(false);
    }, 2000);
  };

  // Reset the scanner view
  const resetScanner = () => {
    setLastScannedCode(null);
    setFoundItem(null);
  };

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Barcode Scanner</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scan Barcode</CardTitle>
            <CardDescription>
              Position barcode in the scanner window
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="w-full aspect-video bg-gray-900 relative rounded-lg overflow-hidden flex items-center justify-center"
                style={{ minHeight: "240px" }}
              >
                {isScanning ? (
                  <div className="animate-pulse text-white">Scanning...</div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="border-2 border-blue-500 w-3/4 h-1/3 relative z-10">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500"></div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning}
                  className="w-full"
                >
                  {isScanning ? "Scanning..." : "Start Scanning"}
                </Button>
                {lastScannedCode && (
                  <Button 
                    variant="outline"
                    onClick={resetScanner}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Scan Result</CardTitle>
            <CardDescription>
              Information for the scanned item
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastScannedCode ? (
              <div>
                <p className="mb-4">
                  <strong>Barcode:</strong> {lastScannedCode}
                </p>
                
                {foundItem ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm text-gray-500">Item Name</div>
                        <div className="font-medium">{foundItem.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Category</div>
                        <div className="font-medium">{foundItem.category}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Quantity</div>
                        <div className="font-medium">{foundItem.quantity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium">{foundItem.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="flex-1">Update Quantity</Button>
                      <Button variant="outline" className="flex-1">View Details</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-yellow-800">Item not found in inventory.</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add to Inventory
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-center">
                <p>Scan a barcode to view item information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}