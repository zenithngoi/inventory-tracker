import { useState } from "react";
import { useAlerts } from "./alert-provider";
import { Button } from "@/components/ui/button";
import { BellIcon, CheckIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
  const { alerts, unreadCount, markAsRead, markAllAsRead, clearAlerts } = useAlerts();
  const [open, setOpen] = useState(false);

  const getAlertTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "error":
        return "bg-red-50 border-red-200 text-red-700";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {alerts.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  markAllAsRead();
                  setOpen(false);
                }}
              >
                <CheckIcon className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  clearAlerts();
                  setOpen(false);
                }}
              >
                <TrashIcon className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ScrollArea className="h-80">
            <DropdownMenuGroup>
              {alerts.map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  className={`flex flex-col items-start border-l-2 p-4 ${
                    !alert.isRead ? "bg-muted/50" : ""
                  } ${getAlertTypeStyles(alert.type)}`}
                  onClick={() => {
                    if (!alert.isRead) markAsRead(alert.id);
                    if (alert.actionUrl) window.location.href = alert.actionUrl;
                  }}
                >
                  <div className="flex w-full flex-col">
                    <div className="flex items-start justify-between">
                      <span className="font-medium">{alert.title}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs">{alert.message}</p>
                    {alert.actionUrl && alert.actionText && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-xs justify-start"
                      >
                        {alert.actionText}
                      </Button>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {format(alert.timestamp, "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}