import { Route, Routes } from 'react-router-dom';

import NotFoundPage from '@/pages/modules/salary-manager/NotFoundPage';
import EmployeesPage from '@/pages/modules/salary-manager/EmployeesPage';
import DashboardPage from '@/pages/modules/salary-manager/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import PaymentHistoryPage from '@/pages/modules/salary-manager/PaymentHistoryPage';
import TransferDetailsPage from '@/pages/modules/salary-manager/TransferDetailsPage';
import AppSelectionPage from '@/pages/AppSelectionPage';
import InventoryPage from '@/pages/modules/inventory-manager/InventoryPage';
import InventorySettingsPage from '@/pages/modules/inventory-manager/InventorySettingsPage';
import StockEntriesPage from '@/pages/modules/inventory-manager/StockEntriesPage';
import StockChangesPage from '@/pages/modules/inventory-manager/StockChangesPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppSelectionPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/salary" element={<DashboardPage />} />
      <Route path="/salary/employees" element={<EmployeesPage />} />
      <Route path="/salary/payments" element={<PaymentHistoryPage />} />
      <Route path="/salary/payments/:id" element={<TransferDetailsPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/inventory/settings" element={<InventorySettingsPage />} />
      <Route path="/inventory/stock" element={<StockChangesPage />} />
      <Route path="/stock" element={<StockChangesPage />} />
      <Route path="/inventory/:itemId/entries" element={<StockEntriesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
