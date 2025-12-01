import { User } from 'lucide-react';
import { formatDate, formatKobo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  _id: string;
  amountInKobo: number;
  status: string;
  createdAt: string;
  employee: {
    name?: string;
    position?: string;
  };
}

interface PaymentsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const PaymentsTable = ({ transactions, isLoading = false }: PaymentsTableProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <PaymentsTableSkeleton />;
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <User className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">This transfer doesn't contain any individual transactions.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="block sm:hidden divide-y divide-gray-200">
        {transactions.map((transaction) => {
          const employee = transaction.employee;
          return (
            <div key={transaction._id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {employee?.name || 'Unknown Employee'}
                      </p>
                      <p className="text-sm text-gray-600">{employee?.position || 'N/A'}</p>
                    </div>
                    <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                      {transaction.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="ml-10 flex gap-2 justify-between items-center">
                    <p className="text-lg font-bold text-green-600">
                      {formatKobo(transaction.amountInKobo)}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Paid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const employee = transaction.employee;
              return (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee?.name || 'Unknown Employee'}
                        </div>
                        <div className="text-sm text-gray-500">{employee?.position || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatKobo(transaction.amountInKobo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                      {transaction.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                    {formatDate(transaction.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export const PaymentsTableSkeleton = () => (
  <>
    <div className="hidden sm:block">
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="px-6 py-4 border-b last:border-b-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>

    <div className="block sm:hidden">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 border-b last:border-b-0">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default PaymentsTable;
