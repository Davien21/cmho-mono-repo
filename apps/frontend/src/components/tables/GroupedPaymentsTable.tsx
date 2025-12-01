import { Eye } from 'lucide-react';
import { formatDate, formatKobo } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPaymentsView } from '../EmptyPaymentsView';
import { IAPIResponse, ITransferResponse } from '@/types';

interface GroupedPaymentsProps {
  data?: IAPIResponse<ITransferResponse>;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

const GroupedPaymentsTable = ({
  data: transfersResponse,
  isLoading,
  isFetching,
  refetch,
}: GroupedPaymentsProps) => {
  const navigate = useNavigate();

  const transfers = transfersResponse?.data.transfers || [];

  const handleViewDetails = (transferId: string) => {
    navigate(`/salary/payments/${transferId}`);
  };

  if (isLoading) return <TableSkeleton />;

  if (transfers.length === 0)
    return <EmptyPaymentsView onRefresh={refetch} isFetching={isFetching} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Mobile View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {transfers.map((transfer) => (
            <div key={transfer._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {formatKobo(transfer.amountInKobo)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{formatDate(transfer.createdAt)}</p>
                  <p className="text-sm text-blue-600">{transfer.transactionCount} payments</p>
                </div>
                <button
                  onClick={() => handleViewDetails(transfer._id)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. of Payments
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatKobo(transfer.amountInKobo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(transfer.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {transfer.transactionCount || 0} payments
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(transfer._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="hidden sm:block">
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b last:border-b-0">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="block sm:hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-b last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default GroupedPaymentsTable;
