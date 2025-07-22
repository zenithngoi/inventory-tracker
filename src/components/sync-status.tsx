import { useSyncManager } from "@/hooks/use-sync-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Globe, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const SyncStatus = () => {
  const { 
    isOnline, 
    isSyncing, 
    triggerSync, 
    getPendingActionsCount 
  } = useSyncManager();
  
  const pendingCount = getPendingActionsCount();
  
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isOnline ? "default" : "destructive"}
            className={isOnline ? "bg-green-600" : "bg-red-600"}
          >
            <div className="flex items-center gap-1">
              {isOnline ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline 
            ? "Connected to cloud storage" 
            : "Working in offline mode. Changes will sync when you reconnect."}
        </TooltipContent>
      </Tooltip>
      
      {isOnline && pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs flex items-center gap-1"
              disabled={isSyncing}
              onClick={() => triggerSync()}
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : `Sync (${pendingCount})`}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing 
              ? "Syncing data to the cloud..." 
              : `${pendingCount} changes waiting to be synced to cloud`}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};