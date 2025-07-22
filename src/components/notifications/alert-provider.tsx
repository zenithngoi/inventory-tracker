import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Alert } from "./alert";
import { useAuth } from "@/hooks/use-auth";

export type AlertType = "info" | "success" | "warning" | "error";

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface AlertContextType {
  alerts: AlertItem[];
  unreadCount: number;
  addAlert: (alert: Omit<AlertItem, "id" | "timestamp" | "isRead">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load alerts from localStorage on initial load
  useEffect(() => {
    if (user) {
      const savedAlerts = localStorage.getItem(`alerts_${user.id}`);
      if (savedAlerts) {
        try {
          const parsedAlerts = JSON.parse(savedAlerts).map((alert: AlertItem) => ({
            ...alert,
            timestamp: new Date(alert.timestamp)
          }));
          setAlerts(parsedAlerts);
          setUnreadCount(parsedAlerts.filter((alert: AlertItem) => !alert.isRead).length);
        } catch (error) {
          console.error("Failed to parse alerts from localStorage", error);
        }
      }
    }
  }, [user]);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    if (user && alerts.length > 0) {
      localStorage.setItem(`alerts_${user.id}`, JSON.stringify(alerts));
    }
  }, [alerts, user]);

  const addAlert = (alertData: Omit<AlertItem, "id" | "timestamp" | "isRead">) => {
    const newAlert: AlertItem = {
      ...alertData,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      isRead: false,
    };
    
    setAlerts(prev => [newAlert, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show a toast for the new alert
    Alert.show({
      ...alertData,
      timeout: 6000,
    });
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, isRead: true } : alert
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setAlerts(prev => 
      prev.map(alert => ({ ...alert, isRead: true }))
    );
    setUnreadCount(0);
  };

  const clearAlerts = () => {
    setAlerts([]);
    setUnreadCount(0);
    if (user) {
      localStorage.removeItem(`alerts_${user.id}`);
    }
  };

  return (
    <AlertContext.Provider 
      value={{ 
        alerts, 
        unreadCount, 
        addAlert, 
        markAsRead, 
        markAllAsRead, 
        clearAlerts 
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
};