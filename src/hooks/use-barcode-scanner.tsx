import { useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

interface UseBarcodeScanner {
  startScanning: () => void;
  stopScanning: () => void;
  scanResult: string | null;
  isScanning: boolean;
  scannerRef: React.RefObject<HTMLDivElement>;
  error: string | null;
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    codeReaderRef.current?.reset();
  }, []);

  const startScanning = useCallback(() => {
    if (!scannerRef.current) {
      setError('Scanner reference not available');
      return;
    }
    setError(null);
    setScanResult(null);
    setIsScanning(true);

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    codeReader.decodeFromVideoDevice(
      undefined,
      scannerRef.current,
      (result, err) => {
        if (result) {
          setScanResult(result.getText());
          stopScanning();
        } else if (err && !(err instanceof NotFoundException)) {
          setError('Scanning error: ' + err.message);
        }
      }
    ).catch((e) => {
      setError('Camera error: ' + e.message);
      setIsScanning(false);
    });
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