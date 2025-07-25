import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useEffect } from "react";
import { XCircle, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const {
    startScanning,
    stopScanning,
    scanResult,
    isScanning,
    scannerRef,
    error
  } = useBarcodeScanner();

  // Start scanning when component mounts
  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  // When we have a scan result, pass it to the parent
  useEffect(() => {
    if (scanResult) {
      onScan(scanResult);
    }
  }, [scanResult, onScan]);

  return (
    <Card className="p-4 w-full max-w-md mx-auto relative">
      <div className="absolute top-2 right-2 z-50">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Barcode Scanner</h3>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded text-sm">
            {error}
          </div>
        )}
        
        <div 
          ref={scannerRef} 
          className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden relative flex items-center justify-center"
        >
          {isScanning ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Scanning...</p>
            </div>
          ) : scanResult ? (
            <div className="text-center">
              <p className="text-green-600 font-medium">Scanned Successfully!</p>
              <p className="font-mono text-sm">{scanResult}</p>
            </div>
          ) : (
            <div className="text-center">
              <Button onClick={startScanning}>
                Start Scanner
              </Button>
            </div>
          )}
        </div>
        
        {scanResult && (
          <div className="p-2 bg-green-100 text-green-800 rounded text-center">
            Barcode detected: <strong>{scanResult}</strong>
          </div>
        )}
        
        <div className="flex justify-between">
          {isScanning ? (
            <Button onClick={stopScanning} variant="destructive">
              Stop Scanner
            </Button>
          ) : (
            <Button onClick={startScanning} disabled={!!scanResult}>
              {scanResult ? "Scan Complete" : "Start Scanner"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}