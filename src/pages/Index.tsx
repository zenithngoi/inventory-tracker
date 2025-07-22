import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ScanLine, BarChart3, ClipboardCheck, Clock, Download } from "lucide-react";
import { MobileDetection } from "@/components/mobile-detection";

export default function WelcomePage() {
  const navigate = useNavigate();
  
  // Mobile specific welcome page
  const mobileContent = (
    <div className="container p-4 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Inventory Scanner
          </h1>
          <p className="text-muted-foreground">
            Mobile-optimized inventory management
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common inventory tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => navigate('/mobile-scan')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <ScanLine className="h-8 w-8" />
              <span>Scan Items</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <BarChart3 className="h-8 w-8" />
              <span>Dashboard</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/items')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <ClipboardCheck className="h-8 w-8" />
              <span>Inventory</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/items/timeline')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Clock className="h-8 w-8" />
              <span>Timeline</span>
            </Button>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/reports')}>
              <Download className="mr-2 h-4 w-4" />
              Export Reports
            </Button>
          </CardFooter>
        </Card>
        
        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="font-medium">💡 Pro Tip:</p>
          <p className="text-muted-foreground mt-1">
            Add this app to your home screen for a full-screen experience and offline access.
          </p>
        </div>
      </div>
    </div>
  );

  // Desktop welcome page
  return (
    <MobileDetection mobileContent={mobileContent}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6 text-center">
        <div className="space-y-8 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Inventory Management System
          </h1>

          <p className="text-xl text-muted-foreground animate-in fade-in delay-300 duration-700">
            Complete inventory tracking with mobile support
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex justify-center">
                  <ScanLine className="h-8 w-8" />
                </CardTitle>
                <CardTitle>Scan Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Scan barcodes with both web and mobile devices. Works offline too!
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button onClick={() => navigate('/scan')}>Start Scanning</Button>
              </CardFooter>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex justify-center">
                  <BarChart3 className="h-8 w-8" />
                </CardTitle>
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View detailed reports and analytics about your inventory.
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button onClick={() => navigate('/dashboard')} variant="outline">Dashboard</Button>
              </CardFooter>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex justify-center">
                  <Clock className="h-8 w-8" />
                </CardTitle>
                <CardTitle>Item Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track complete history of each item in your inventory.
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button onClick={() => navigate('/items/timeline')} variant="outline">View Timeline</Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-12">
            <p className="text-sm text-muted-foreground">
              Try on mobile for the complete experience
            </p>
          </div>
        </div>
      </div>
    </MobileDetection>
  );
}