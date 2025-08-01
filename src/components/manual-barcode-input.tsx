import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ManualBarcodeInputProps {
  onSubmit: (barcode: string) => void;
  buttonLabel?: string;
  buttonIcon?: ReactNode;
  className?: string;
}

export function ManualBarcodeInput({ 
  onSubmit, 
  buttonLabel = "Submit", 
  buttonIcon,
  className
}: ManualBarcodeInputProps) {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onSubmit(barcode);
      setBarcode("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <Input
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Enter barcode"
        className="flex-1"
      />
      <Button type="submit" disabled={!barcode.trim()}>
        {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
        {buttonLabel}
      </Button>
    </form>
  );
}