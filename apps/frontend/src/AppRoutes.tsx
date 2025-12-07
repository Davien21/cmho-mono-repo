import { Route, Routes } from "react-router-dom";

import NotFoundPage from "@/pages/modules/salary-manager/NotFoundPage";
import EmployeesPage from "@/pages/modules/salary-manager/EmployeesPage";
import DashboardPage from "@/pages/modules/salary-manager/DashboardPage";
import AdminsPage from "@/pages/modules/salary-manager/AdminsPage";
import LoginPage from "@/pages/LoginPage";
import PaymentHistoryPage from "@/pages/modules/salary-manager/PaymentHistoryPage";
import TransferDetailsPage from "@/pages/modules/salary-manager/TransferDetailsPage";
import AppSelectionPage from "@/pages/AppSelectionPage";
import InventoryHomePage from "@/pages/modules/inventory-manager/InventoryHomePage";
import InventoryPage from "@/pages/modules/inventory-manager/InventoryPage";
import InventorySettingsPage from "@/pages/modules/inventory-manager/InventorySettingsPage";
import StockEntriesPage from "@/pages/modules/inventory-manager/StockEntriesPage";
import StockChangesPage from "@/pages/modules/inventory-manager/StockChangesPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<DashboardPage />} />
      <Route path="/admin/employees" element={<EmployeesPage />} />
      <Route path="/admin/payments" element={<PaymentHistoryPage />} />
      <Route path="/admin/payments/:id" element={<TransferDetailsPage />} />
      <Route path="/admin/admins" element={<AdminsPage />} />
      <Route path="/inventory" element={<InventoryHomePage />} />
      <Route path="/inventory/items" element={<InventoryPage />} />
      <Route path="/inventory/settings" element={<InventorySettingsPage />} />
      <Route path="/inventory/stock" element={<StockChangesPage />} />
      <Route path="/stock" element={<StockChangesPage />} />
      <Route path="/inventory/:itemId/entries" element={<StockEntriesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
