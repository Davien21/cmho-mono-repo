import { useGetEmployeesQuery } from '@/store/employees-slice';
import { Skeleton } from '../ui/skeleton';
import { formatNaira } from '@/lib/utils';
import { NoEmployees } from '@/components/NoEmployees';

export const RecentEmployeesTable = () => {
  const { data: employeesResponse, isLoading } = useGetEmployeesQuery({
    sort: 'desc',
  });

  if (isLoading) return <TableSkeleton />;

  const employees = employeesResponse?.data || [];
  return (
    <>
      {employees.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Employees</h2>
          </div>
          <div className="divide-y">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{employee.name}</h3>
                  <p className="text-gray-600 text-sm truncate">{employee.position}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-gray-900">{formatNaira(employee.salary)}</p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <NoEmployees />
      )}
    </>
  );
};

const TableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 sm:p-6 border-b">
        <Skeleton className="h-6 w-40" />
      </div>
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
