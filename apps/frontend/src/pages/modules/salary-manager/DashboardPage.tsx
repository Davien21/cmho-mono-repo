import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { RecentEmployeesTable } from '@/components/tables/RecentEmployeesTable';
import { AddEmployeeButton } from '@/components/AddEmployeeButton';
import { DashboardStats } from '@/components/DashboardStats';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your employees' salary information
          </p>
        </div>

        <DashboardStats />

        <div className="flex justify-end">
          <AddEmployeeButton>
            <Plus className="w-5 h-5" />
            Add Employee
          </AddEmployeeButton>
        </div>

        <RecentEmployeesTable />
      </div>
    </Layout>
  );
}
