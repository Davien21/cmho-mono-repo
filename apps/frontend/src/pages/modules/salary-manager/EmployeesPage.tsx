import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { useGetEmployeesQuery } from '@/store/employees-slice';
import { Skeleton } from '@/components/ui/skeleton';
import { NoEmployees } from '@/components/NoEmployees';
import { AddEmployeeButton } from '@/components/AddEmployeeButton';
import { EmployeesTable } from '@/components/tables/EmployeesTable';

export default function EmployeesPage() {
  const { data: employeesResponse, isLoading } = useGetEmployeesQuery({
    sort: 'desc',
  });

  const employees = employeesResponse?.data || [];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage employee details and payments
            </p>
          </div>
          {employees.length > 0 && (
            <AddEmployeeButton>
              <Plus className="w-5 h-5" />
              Add Employee
            </AddEmployeeButton>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>{employees.length === 0 ? <NoEmployees /> : <EmployeesTable employees={employees} />}</>
        )}
      </div>
    </Layout>
  );
}

const TableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="text-left sm:text-right">
              <Skeleton className="h-4 w-24 mb-2 sm:mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
