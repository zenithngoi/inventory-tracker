import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/theme-provider';

// Auth Pages
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';

// Main app pages
import DashboardPage from '@/pages/dashboard';
import InventoryPage from '@/pages/inventory';
import ScannerPage from '@/pages/scanner';
import TransferPage from '@/pages/transfers';
import SettingsPage from '@/pages/settings';

// Protected Route wrapper
import ProtectedRoute from '@/components/protected-route';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="transfers" element={<TransferPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;