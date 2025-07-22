import { toast } from "sonner";
import { AlertCircle, CheckCircle2, InfoIcon, XCircle } from "lucide-react";
import { AlertType } from "./alert-provider";

interface AlertShowProps {
  type: AlertType;
  title: string;
  message: string;
  timeout?: number;
  actionUrl?: string;
  actionText?: string;
}

// Helper for rendering different alert types with appropriate styles
const getAlertIcon = (type: AlertType) => {
  const icons = {
    info: <InfoIcon className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
  };
  
  return icons[type] || icons.info;
};

export const Alert = {
  show: ({ type = "info", title, message, timeout = 5000, actionUrl, actionText }: AlertShowProps) => {
    toast(
      <div className="flex gap-3">
        <div className="shrink-0">{getAlertIcon(type)}</div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm">{message}</div>
          {actionUrl && actionText && (
            <button 
              onClick={() => window.location.href = actionUrl}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>,
      {
        duration: timeout,
      }
    );
  }
};