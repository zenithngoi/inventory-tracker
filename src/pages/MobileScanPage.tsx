import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraIcon, ZapIcon, XCircleIcon, CheckCircleIcon, ArrowLeftIcon } from "lucide-react";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { Alert } from "@/components/notifications/alert";

const MobileScanPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const { logActivity } = useActivityLogger();
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if device is mobile and has camera capabilities
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);
  }, []);
  
  const startScanner = async () => {
    try {
      setScanError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setHasPermission(true);
        
        // Start continuous scanning
        scanIntervalRef.current = setInterval(() => {
          captureAndProcessFrame();
        }, 500); // Scan every 500ms
      }
    } catch (error) {
      console.error("Camera permission denied or error:", error);
      setScanError("Camera access was denied or is not available");
      setHasPermission(false);
    }
  };
  
  const stopScanner = () => {
    if (isScanning && videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach((track) => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
      setIsScanning(false);
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }
  };
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);
  
  const captureAndProcessFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0) return;
    
    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // This is where you would integrate with a barcode scanning library
    // For now we'll simulate a successful scan
    simulateSuccessfulScan();
  };
  
  const simulateSuccessfulScan = () => {
    // Generate a random barcode number for demonstration
    const mockBarcodeFormats = ["EAN-13", "CODE-128", "QR-CODE"];
    const mockBarcode = `ITEM-${Math.floor(Math.random() * 10000)}`;
    
    if (!scannedItems.includes(mockBarcode) && Math.random() > 0.7) {
      processScannedItem(mockBarcode);
    }
  };
  
  const processScannedItem = (barcode: string) => {
    // Play success sound
    const audio = new Audio('/scan-beep.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
    
    // Visual feedback
    Alert.show({
      type: "success",
      title: "Item Scanned",
      message: `Barcode: ${barcode}`,
      timeout: 2000
    });
    
    // Add to scanned items
    setScannedItems((prev) => [...prev, barcode]);
    
    // Log the scan activity
    logActivity({
      action: "scan_in",
      item_id: barcode,
      item_name: `Item ${barcode.split('-')[1]}`,
      details: {
        scan_type: "mobile_camera",
        barcode: barcode
      }
    });
  };
  
  const handleManualEntry = () => {
    const barcode = prompt("Enter item barcode or ID:");
    if (barcode && barcode.trim() !== "") {
      processScannedItem(barcode);
    }
  };
  
  return (
    <div className="container max-w-md py-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <CardTitle>Mobile Scanner</CardTitle>
            <div className="w-9"></div> {/* Empty div for centering */}
          </div>
        </CardHeader>
        
        <CardContent>
          {scanError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {scanError}
            </div>
          )}
          
          <div className="relative">
            {isScanning ? (
              <div className="relative rounded-md overflow-hidden bg-black aspect-[4/3] w-full">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute inset-0 border-2 border-primary/50 rounded-md"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-16 border-2 border-primary rounded-md"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-muted rounded-md aspect-[4/3] w-full">
                <CameraIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <h3 className="font-medium">Scanned Items: {scannedItems.length}</h3>
            <div className="max-h-32 overflow-y-auto bg-muted p-2 rounded-md">
              {scannedItems.length > 0 ? (
                <ul className="space-y-1">
                  {scannedItems.map((item, index) => (
                    <li key={index} className="text-sm flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No items scanned yet
                </p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          {!isScanning ? (
            <Button 
              className="flex-1"
              onClick={startScanner}
              disabled={!isMobileDevice}
            >
              <CameraIcon className="mr-2 h-4 w-4" />
              Start Scanner
            </Button>
          ) : (
            <Button 
              className="flex-1"
              variant="destructive"
              onClick={stopScanner}
            >
              <XCircleIcon className="mr-2 h-4 w-4" />
              Stop Scanner
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={handleManualEntry}
          >
            <ZapIcon className="mr-2 h-4 w-4" />
            Manual Entry
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MobileScanPage;