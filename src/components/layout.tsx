import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package2,
  QrCode,
  ArrowLeftRight,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { name: 'Inventory', path: '/inventory', icon: <Package2 className="h-5 w-5 mr-3" /> },
    { name: 'Scanner', path: '/scanner', icon: <QrCode className="h-5 w-5 mr-3" /> },
    { name: 'Transfers', path: '/transfers', icon: <ArrowLeftRight className="h-5 w-5 mr-3" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between py-4">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex flex-col space-y-1 flex-1">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-sm ${
                          location.pathname === item.path
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        } rounded-md`}
                        onClick={() => setOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  <div className="py-4">
                    <Button
                      variant="ghost"
                      className="w-full flex justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden lg:flex items-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mr-2">
                <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="2" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
              <h1 className="text-xl font-bold">Franchise Inventory</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar - Hidden on Mobile */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
          <nav className="flex flex-col flex-1 p-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } rounded-md`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full flex justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}