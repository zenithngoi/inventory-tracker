import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { 
  BarChart3,
  CircleDollarSign,
  ClipboardCheck,
  Home,
  Layers,
  LayoutDashboard, 
  Package,
  PackageSearch,
  QrCode,
  Settings,
  ShoppingCart,
  Users,
  FileText,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarNavProps) {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.isAdmin === true;

  return (
    <div className={cn("pb-12 w-full", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <QrCode className="mr-2 h-4 w-4" />
              <span>Scan Items</span>
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Inventory</span>
            </NavLink>
            <NavLink
              to="/transfers"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <Layers className="mr-2 h-4 w-4" />
              <span>Transfers</span>
            </NavLink>
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Reporting
          </h2>
          <div className="space-y-1">
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </NavLink>
            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <CircleDollarSign className="mr-2 h-4 w-4" />
              <span>Financial Metrics</span>
            </NavLink>
            <NavLink
              to="/logs"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>Activity Logs</span>
              <span className="ml-auto bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">New</span>
            </NavLink>
          </div>
        </div>

        {isAdmin && (
          <div className="px-4 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Administration
            </h2>
            <div className="space-y-1">
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Users</span>
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </NavLink>
              <NavLink
                to="/dev-tools"
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dev Tools</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}