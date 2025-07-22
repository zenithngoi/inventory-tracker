import { useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import Sidebar from "./sidebar";
import { AuthProvider } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar open={sidebarOpen} onClose={toggleSidebar} />
        <div className="flex flex-col flex-1">
          <Header onMenuToggle={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
};

export default Layout;