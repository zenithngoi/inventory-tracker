import { useRef, useState, useCallback } from 'react';

interface UseBarcodeScanner {
  startScanning: () => void;
  stopScanning: () => void;
  scanResult: string | null;
  isScanning: boolean;
  scannerRef: React.RefObject<HTMLDivElement>;
  error: string | null;
}

// Simplified mock barcode scanner that doesn't rely on external libraries
export function useBarcodeScanner(): UseBarcodeScanner {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(() => {
    if (!scannerRef.current) {
      setError('Scanner reference not available');
      return;
    }

    setError(null);
    setScanResult(null);
    setIsScanning(true);
    
    // Mock barcode detection - in a real app this would use camera API
    // For demo purposes, we'll simulate a scan after a short delay
    setTimeout(() => {
      // Generate a random barcode for testing
      const mockBarcode = `ITEM${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setScanResult(mockBarcode);
      stopScanning();
    }, 1500);
  }, [stopScanning]);

  return {
    startScanning,
    stopScanning,
    scanResult,
    isScanning,
    scannerRef,
    error,
  };
}