import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ItemTimelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { getActivityLogs } = useActivityLogger();
  const { itemId } = useParams();
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const logs = await getActivityLogs({ 
          itemId: itemId,
          limit: 100 
        });
        
        // Sort logs from newest to oldest
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityLogs(logs);
      } catch (error) {
        console.error("Error fetching item timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [itemId]);
  
  const filteredLogs = activityLogs.filter(log => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (log.item_name && log.item_name.toLowerCase().includes(searchLower)) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchLower)) ||
      (log.action && log.action.toLowerCase().includes(searchLower))
    );
  });
  
  const getBadgeColor = (action: string) => {
    const actionMap: Record<string, string> = {
      scan_in: "bg-blue-100 text-blue-800",
      scan_out: "bg-orange-100 text-orange-800",
      item_update: "bg-indigo-100 text-indigo-800",
      transfer_create: "bg-purple-100 text-purple-800",
      transfer_approve: "bg-green-100 text-green-800",
      transfer_reject: "bg-red-100 text-red-800",
      sale: "bg-emerald-100 text-emerald-800",
      stock_adjustment: "bg-amber-100 text-amber-800"
    };
    
    return actionMap[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container max-w-7xl py-6">
      <h1 className="text-3xl font-bold mb-6">Item Timeline</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {itemId ? "Item History" : "All Items History"}
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </CardTitle>
          <CardDescription>
            {itemId
              ? "Complete history of this item's lifecycle"
              : "View the history of all inventory items"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item, user, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="relative pl-8 border-l">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="mb-8 relative">
                  <div className="absolute -left-[41px] h-6 w-6 rounded-full bg-background border-4 border-primary"></div>
                  <div className="pb-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={getBadgeColor(log.action)}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium">
                      {log.item_name || "Unknown Item"}
                      {log.item_barcode && 
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          #{log.item_barcode}
                        </span>
                      }
                    </h3>
                    
                    <p className="text-sm mt-1">
                      {log.user_name || log.user_email || "Unknown user"} 
                      {getActionDescription(log)}
                    </p>
                    
                    {log.details && (
                      <div className="mt-2 text-xs p-2 bg-muted rounded-md">
                        {renderDetailsByAction(log)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activity logs found{searchQuery ? " matching your search" : ""}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getActionDescription(log: any) {
  const actionMap: Record<string, string> = {
    scan_in: "scanned this item in",
    scan_out: "scanned this item out",
    item_update: "updated item details",
    transfer_create: "created a transfer request",
    transfer_approve: "approved a transfer request",
    transfer_reject: "rejected a transfer request",
    sale: "completed a sale",
    stock_adjustment: "adjusted stock levels"
  };
  
  return actionMap[log.action] || "performed an action";
}

function renderDetailsByAction(log: any) {
  switch(log.action) {
    case 'item_update':
      return (
        <div className="space-y-1">
          <div>
            Changes made to: {Object.keys(log.details?.changes || {}).join(', ')}
          </div>
          {(log.details?.quantityBefore !== undefined && log.details?.quantityAfter !== undefined) && (
            <div>
              Quantity changed from {log.details.quantityBefore} to {log.details.quantityAfter}
            </div>
          )}
        </div>
      );
    
    case 'transfer_create':
    case 'transfer_approve':
    case 'transfer_reject':
      return (
        <div className="space-y-1">
          <div>
            Transfer ID: {log.details?.transfer_id || 'Unknown'}
          </div>
          <div>
            From: {log.details?.from_location || 'Unknown'} → 
            To: {log.details?.to_location || 'Unknown'}
          </div>
          <div>Quantity: {log.details?.quantity || 0}</div>
        </div>
      );
    
    case 'sale':
      return (
        <div className="space-y-1">
          <div>Amount: ${log.details?.amount?.toFixed(2) || '0.00'}</div>
          <div>Quantity sold: {log.details?.quantity || 1}</div>
        </div>
      );
      
    case 'stock_adjustment':
      return (
        <div className="space-y-1">
          <div>Reason: {log.details?.reason || 'No reason provided'}</div>
          <div>
            Quantity changed from {log.details?.quantityBefore || 0} to {log.details?.quantityAfter || 0}
          </div>
        </div>
      );
      
    default:
      return (
        <pre className="overflow-auto text-xs">
          {JSON.stringify(log.details, null, 2)}
        </pre>
      );
  }
}