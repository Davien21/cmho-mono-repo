import PaymentsTable, { PaymentsTableSkeleton } from '@/components/tables/PaymentsTable';
import { EmptyPaymentsView } from '../EmptyPaymentsView';
import { IAPIResponse } from '@/types';
import { ITransactionsResponse } from '@/store/transactions-slice';

interface ListedPaymentsProps {
  data?: IAPIResponse<ITransactionsResponse>;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

const ListedPaymentsTable = ({
  data: transactionsResponse,
  isLoading,
  isFetching,
  refetch,
}: ListedPaymentsProps) => {
  const transactions = transactionsResponse?.data.transactions || [];

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (transactions.length === 0) {
    return <EmptyPaymentsView onRefresh={refetch} isFetching={isFetching} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <PaymentsTable transactions={transactions} />
      </div>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <PaymentsTableSkeleton />
    </div>
  </div>
);

export default ListedPaymentsTable;
