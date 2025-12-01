import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export const EmptyPaymentsView = ({
  onRefresh,
  isFetching,
}: {
  onRefresh: () => void;
  isFetching: boolean;
}) => (
  <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
    <button onClick={onRefresh} className="text-gray-400 mb-4" disabled={isFetching}>
      <RefreshCw className={cn('w-12 h-12 mx-auto', isFetching && 'animate-spin')} />
    </button>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
    <p className="text-gray-600">
      Transfer records will appear here once salary payments are processed.
    </p>
  </div>
);
