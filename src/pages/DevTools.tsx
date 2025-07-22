import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

export default function DevTools() {
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState('users');
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const { toast } = useToast();

  // Load all localStorage data
  useEffect(() => {
    const loadData = () => {
      const data: Record<string, any> = {};
      
      // List of important keys to track
      const keysToTrack = [
        'users', 
        'user_profiles', 
        'inventory-transfers', 
        'inventory-items',
        'auth_user',
        'auth_profile'
      ];
      
      // Load all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              data[key] = JSON.parse(value);
            }
          } catch (error) {
            console.error(`Error parsing localStorage key ${key}:`, error);
            // If it's not JSON, store as string
            const value = localStorage.getItem(key);
            if (value) {
              data[key] = value;
            }
          }
        }
      }
      
      // Add empty arrays for important keys that don't exist yet
      keysToTrack.forEach(key => {
        if (!data[key]) {
          data[key] = [];
        }
      });
      
      setLocalStorageData(data);
    };
    
    loadData();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event to reload data
    const handleCustomEvent = () => {
      loadData();
    };
    
    window.addEventListener('localStorageUpdated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleCustomEvent);
    };
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setEditMode(false);
    if (localStorageData[value]) {
      setEditContent(JSON.stringify(localStorageData[value], null, 2));
    } else {
      setEditContent('');
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      setEditMode(false);
    } else {
      setEditContent(JSON.stringify(localStorageData[selectedTab], null, 2));
      setEditMode(true);
    }
  };

  // Save edited content
  const saveContent = () => {
    try {
      const parsedContent = JSON.parse(editContent);
      localStorage.setItem(selectedTab, JSON.stringify(parsedContent));
      
      // Update state
      setLocalStorageData(prev => ({
        ...prev,
        [selectedTab]: parsedContent
      }));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('localStorageUpdated'));
      
      toast({
        title: "Saved successfully",
        description: `Updated ${selectedTab} data in localStorage`,
      });
      
      setEditMode(false);
    } catch (error) {
      toast({
        title: "Error saving data",
        description: "Invalid JSON format. Please check your edits.",
        variant: "destructive"
      });
    }
  };

  // Clear all data
  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all app data? This cannot be undone.")) {
      localStorage.clear();
      setLocalStorageData({});
      toast({
        title: "Data cleared",
        description: "All localStorage data has been removed",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Developer Tools</h1>
      <p className="text-muted-foreground mb-8">
        View and manage application data stored in localStorage
      </p>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Data Explorer</CardTitle>
            <CardDescription>
              View and edit all data stored in your browser's localStorage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="user_profiles">Profiles</TabsTrigger>
                <TabsTrigger value="inventory-transfers">Transfers</TabsTrigger>
                <TabsTrigger value="inventory-items">Inventory</TabsTrigger>
              </TabsList>
              
              {Object.keys(localStorageData).map(key => (
                <TabsContent key={key} value={key} className="space-y-4">
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-medium">{key}</h3>
                    <Button 
                      onClick={toggleEditMode}
                      variant={editMode ? "destructive" : "outline"}
                    >
                      {editMode ? "Cancel" : "Edit Data"}
                    </Button>
                  </div>
                  
                  {editMode ? (
                    <div className="space-y-4">
                      <textarea
                        className="w-full min-h-[400px] font-mono text-sm p-4 border rounded-md"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <Button onClick={saveContent}>Save Changes</Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] rounded-md border p-4">
                      <pre className="text-sm font-mono">
                        {JSON.stringify(localStorageData[key], null, 2)}
                      </pre>
                    </ScrollArea>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={clearAllData}
            >
              Clear All Data
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.dispatchEvent(new Event('localStorageUpdated'))}
            >
              Refresh Data
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}