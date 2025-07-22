import { useState } from "react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { initialInventoryData, categoryOptions, locationOptions } from "@/lib/inventory-data";
import { ArrowLeft, Download, Upload, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [importData, setImportData] = useState("");
  
  const handleExport = () => {
    try {
      const inventoryItems = localStorage.getItem("inventoryItems");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(inventoryItems || "[]");
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "inventory_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast({
        title: "Export Successful",
        description: "Your inventory data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your inventory data.",
        variant: "destructive",
      });
    }
  };
  
  const handleImport = () => {
    try {
      if (!importData.trim()) {
        toast({
          title: "Import Failed",
          description: "Please paste valid JSON data.",
          variant: "destructive",
        });
        return;
      }
      
      const parsedData = JSON.parse(importData);
      localStorage.setItem("inventoryItems", JSON.stringify(parsedData));
      
      toast({
        title: "Import Successful",
        description: "Your inventory data has been imported successfully.",
      });
      
      setImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid JSON format. Please check your data and try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      localStorage.setItem("inventoryItems", JSON.stringify(initialInventoryData));
      
      toast({
        title: "Data Reset",
        description: "Your inventory has been reset to the initial sample data.",
      });
    }
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL inventory data? This action cannot be undone.")) {
      localStorage.setItem("inventoryItems", JSON.stringify([]));
      
      toast({
        title: "Data Cleared",
        description: "All inventory data has been removed.",
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        <div className="grid gap-6 max-w-xl mx-auto">
          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export, import, or reset your inventory data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleExport}
                variant="secondary"
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Inventory Data
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="import-data">Import Data (JSON format)</Label>
                <Textarea 
                  id="import-data"
                  placeholder="Paste your JSON data here"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={handleImport}
                  variant="secondary"
                  className="w-full flex items-center gap-2"
                  disabled={!importData.trim()}
                >
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Reset Options */}
          <Card>
            <CardHeader>
              <CardTitle>Reset Options</CardTitle>
              <CardDescription>
                Reset or clear all inventory data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Reset to Sample Data
                </Button>
                <Button 
                  onClick={handleClearAll}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h3 className="font-medium">Inventory Scanner App</h3>
                <p className="text-sm text-muted-foreground">
                  Version 1.0.0
                </p>
              </div>
              <p className="text-sm">
                A barcode scanning inventory management app for warehouse and sales tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}