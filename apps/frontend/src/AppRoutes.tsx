import { Route, Routes } from "react-router-dom";

import NotFoundPage from "@/pages/NotFoundPage";
import EmployeesPage from "@/pages/EmployeesPage";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import PaymentHistoryPage from "@/pages/PaymentHistoryPage";
import TransferDetailsPage from "@/pages/TransferDetailsPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/payments" element={<PaymentHistoryPage />} />
      <Route path="/payments/:id" element={<TransferDetailsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
