import { Users, Wallet } from 'lucide-react';

import { formatNaira } from '@/lib/utils';
import { Calculator } from 'lucide-react';
import { useGetDashboardStatsQuery } from '@/store/dashboard-slice';
import { Skeleton } from './ui/skeleton';

export const DashboardStats = () => {
  const { data: dashboardStats, isLoading } = useGetDashboardStatsQuery();

  const { totalEmployees, totalMonthlySalaries, accountBalance } = dashboardStats?.data || {
    totalEmployees: 0,
    totalMonthlySalaries: 0,
    accountBalance: 0,
  };

  const stats = [
    {
      name: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Monthly Salaries',
      value: formatNaira(totalMonthlySalaries),
      icon: Calculator,
      color: 'bg-green-500',
    },
    {
      name: 'Account Balance',
      value: formatNaira(accountBalance),
      icon: Wallet,
      color: 'bg-purple-500',
    },
  ];

  return (
    <>
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border">
              <div className="flex items-center">
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {stat.name}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const DashboardStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-[6.5rem]" />
      ))}
    </div>
  );
};
