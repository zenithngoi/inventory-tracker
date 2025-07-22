import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ActivityLog, useActivityLogger } from "@/hooks/use-activity-logger";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DevToolsPage() {
  const { user } = useAuth();
  const { getActivityLogs, syncPendingLogs } = useActivityLogger();
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState<string>("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    // Check if user is admin
    if (user?.user_metadata?.isAdmin) {
      setIsAdmin(true);
    }

    // Get all localStorage keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    setLocalStorageKeys(keys);

    // Load recent activity logs
    loadRecentLogs();
  }, [user]);

  const loadRecentLogs = async () => {
    try {
      setIsLoading(true);
      const logs = await getActivityLogs({ limit: 10 });
      setRecentLogs(logs);
    } catch (error) {
      console.error("Failed to load activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectKey = (key: string) => {
    setSelectedKey(key);
    const value = localStorage.getItem(key);
    setKeyValue(value || "");
  };

  const handleSaveValue = () => {
    if (!selectedKey) return;
    
    try {
      // Try parsing as JSON to validate
      JSON.parse(keyValue);
      
      // Save to localStorage
      localStorage.setItem(selectedKey, keyValue);
      toast.success("Value saved to localStorage");
    } catch (e) {
      toast.error("Invalid JSON format");
    }
  };

  const handleDeleteKey = () => {
    if (!selectedKey) return;
    
    localStorage.removeItem(selectedKey);
    toast.success(`Deleted key: ${selectedKey}`);
    
    // Update keys list
    setLocalStorageKeys(localStorageKeys.filter(key => key !== selectedKey));
    setSelectedKey(null);
    setKeyValue("");
  };

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to clear all localStorage data? This cannot be undone.")) {
      localStorage.clear();
      toast.success("All localStorage data cleared");
      setLocalStorageKeys([]);
      setSelectedKey(null);
      setKeyValue("");
    }
  };

  const prettyFormatJson = (value: string): string => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch (e) {
      return value;
    }
  };

  const getLocalStorageSize = (): string => {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        size += (localStorage.getItem(key) || "").length;
      }
    }
    
    // Convert to KB
    const kbSize = size / 1024;
    
    if (kbSize < 1000) {
      return `${kbSize.toFixed(2)} KB`;
    } else {
      // Convert to MB
      return `${(kbSize / 1024).toFixed(2)} MB`;
    }
  };

  const syncAllData = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Syncing all pending data...");
      await syncPendingLogs();
      toast.success("All data synchronized");
      loadRecentLogs();
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to synchronize data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl py-6">
      <h1 className="text-3xl font-bold mb-6">Developer Tools</h1>
      
      <Tabs defaultValue="localStorage">
        <TabsList className="mb-4">
          <TabsTrigger value="localStorage">Local Storage</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activityLogs">Activity Logs</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="localStorage">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Storage Keys</CardTitle>
                <CardDescription>
                  {localStorageKeys.length} items ({getLocalStorageSize()})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="max-h-[400px] overflow-auto space-y-1">
                  {localStorageKeys.map(key => (
                    <Button 
                      key={key}
                      variant={selectedKey === key ? "default" : "ghost"}
                      onClick={() => handleSelectKey(key)}
                      className="w-full justify-start text-left h-auto py-2"
                    >
                      <div>
                        <div className="font-medium">{key}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {localStorage.getItem(key)?.substring(0, 30)}...
                        </div>
                      </div>
                    </Button>
                  ))}
                  {localStorageKeys.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">
                      No localStorage keys found
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="destructive"
                  onClick={handleClearAllData}
                  className="w-full"
                >
                  Clear All Data
                </Button>
              </CardFooter>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Key Value</CardTitle>
                <CardDescription>
                  {selectedKey ? `Editing: ${selectedKey}` : "Select a key to edit"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={selectedKey ? prettyFormatJson(keyValue) : ""}
                  onChange={e => setKeyValue(e.target.value)}
                  placeholder="Select a key to view its value"
                  className="font-mono text-sm"
                  disabled={!selectedKey}
                  rows={15}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="destructive"
                  onClick={handleDeleteKey}
                  disabled={!selectedKey}
                >
                  Delete Key
                </Button>
                <Button
                  onClick={handleSaveValue}
                  disabled={!selectedKey}
                >
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Current user details and authentication status</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">User ID</Label>
                      <div className="mt-1 font-mono text-sm bg-muted p-2 rounded-md">
                        {user.id}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="mt-1 font-mono text-sm bg-muted p-2 rounded-md">
                        {user.email}
                        {user.email_confirmed_at ? (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">User Metadata</Label>
                    <pre className="mt-1 font-mono text-sm bg-muted p-2 rounded-md overflow-auto max-h-48">
                      {JSON.stringify(user.user_metadata, null, 2)}
                    </pre>
                  </div>
                  
                  {isAdmin && (
                    <>
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium">Administrative Access</Label>
                        <div className="mt-2 flex items-center space-x-2">
                          <Switch id="admin-mode" checked={true} disabled />
                          <Label htmlFor="admin-mode">Admin Mode Enabled</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Session Details</Label>
                        <pre className="mt-1 font-mono text-sm bg-muted p-2 rounded-md overflow-auto max-h-48">
                          {JSON.stringify({
                            provider: user.app_metadata?.provider || "email",
                            created_at: user.created_at,
                            updated_at: user.updated_at,
                            last_sign_in_at: user.last_sign_in_at,
                            email_confirmed_at: user.email_confirmed_at,
                          }, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p>Not logged in</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activityLogs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activity Logs</span>
                <Button 
                  size="sm" 
                  onClick={() => loadRecentLogs()}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Showing the 10 most recent activities in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : recentLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>{log.user_name || log.user_email}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.item_name || log.item_barcode || '—'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              alert(JSON.stringify(log.details, null, 2));
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activity logs found</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.location.href = '/logs'}>
                View All Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>
                Manage data synchronization between local storage and cloud database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Activity Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {recentLogs.filter(log => !log.synced).length}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pending logs to be synchronized
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Last Sync</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {recentLogs.length > 0 
                        ? format(new Date(recentLogs[0].timestamp), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last successful synchronization
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Connection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{navigator.onLine ? 'Online' : 'Offline'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current network status
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={syncAllData}
                  disabled={isLoading || !navigator.onLine}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Syncing...
                    </>
                  ) : (
                    'Sync All Pending Data'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}