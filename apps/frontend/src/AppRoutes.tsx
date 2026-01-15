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
import StockOptionsPage from "@/pages/modules/inventory-manager/StockOptionsPage";
import BalanceStockPage from "@/pages/modules/inventory-manager/BalanceStockPage";
import UpdateStockPage from "@/pages/modules/inventory-manager/UpdateStockPage";
import StockActivitiesPage from "@/pages/modules/inventory-manager/StockActivitiesPage";
import ActivitiesPage from "@/pages/modules/inventory-manager/ActivitiesPage";
import AdminActivitiesPage from "@/pages/modules/salary-manager/ActivitiesPage";
import NotificationsPage from "@/pages/modules/inventory-manager/NotificationsPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import LockedScreenPage from "@/pages/LockedScreenPage";

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
      <Route path="/locked" element={<LockedScreenPage />} />
      <Route path="/admin" element={<DashboardPage />} />
      <Route path="/admin/employees" element={<EmployeesPage />} />
      <Route path="/admin/payments" element={<PaymentHistoryPage />} />
      <Route path="/admin/payments/:id" element={<TransferDetailsPage />} />
      <Route path="/admin/admins" element={<AdminsPage />} />
      <Route path="/admin/activities" element={<AdminActivitiesPage />} />
      <Route path="/inventory" element={<InventoryHomePage />} />
      <Route path="/inventory/items" element={<InventoryPage />} />
      <Route path="/inventory/settings" element={<InventorySettingsPage />} />
      <Route path="/inventory/stock" element={<StockOptionsPage />} />
      <Route path="/inventory/stock/balance" element={<BalanceStockPage />} />
      <Route path="/inventory/stock/update" element={<UpdateStockPage />} />
      <Route path="/inventory/stock/activities" element={<StockActivitiesPage />} />
      <Route path="/inventory/activities" element={<ActivitiesPage />} />
      <Route path="/inventory/notifications" element={<NotificationsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
