import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  BarChart3,
  ScanLine,
  ClipboardList,
  Menu as MenuIcon,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const menu = [
    {
      name: "Home",
      href: "/",
      icon: Home
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart3
    },
    {
      name: "Scan Items",
      href: "/mobile-scan",
      icon: ScanLine
    },
    {
      name: "Activity Logs",
      href: "/logs",
      icon: ClipboardList
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="py-6 px-4 border-b">
                  <h2 className="text-lg font-semibold">Inventory App</h2>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || "Welcome"}
                  </p>
                </div>
                <ScrollArea className="flex-1 py-2">
                  <div className="px-2">
                    {menu.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left mb-1",
                          location.pathname === item.href && "bg-muted"
                        )}
                        onClick={() => handleNavigation(item.href)}
                      >
                        <item.icon className="mr-2 h-5 w-5" />
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <Link to="/settings">
                    <Button variant="outline" className="w-full">
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="font-semibold">Inventory Scanner</div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Mobile navigation bar */}
      <nav className="sticky bottom-0 z-50 flex h-14 border-t bg-background">
        {menu.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "flex-1 flex-col h-full rounded-none justify-center items-center",
              location.pathname === item.href && "bg-muted"
            )}
            onClick={() => navigate(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] mt-1">{item.name}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}