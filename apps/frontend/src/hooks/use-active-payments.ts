import { useMemo } from 'react';
import { useGetTransfersQuery } from '@/store/transfers-slice';
import { useGetTransactionsQuery, ITransactionsResponse } from '@/store/transactions-slice';
import { ESortOrder, IAPIResponse, ITransferResponse } from '@/types';

type ViewMode = 'group' | 'list';

// Helper types for the hook return
type GroupData = IAPIResponse<ITransferResponse> | undefined;
type ListData = IAPIResponse<ITransactionsResponse> | undefined;

// Conditional type to determine return data based on view mode
type ActivePaymentsData<T extends ViewMode> = T extends 'group' ? GroupData : ListData;

// Hook parameters interface
interface UseActivePaymentsParams {
  viewMode: ViewMode;
  currentPage: number;
  searchTerm?: string;
}

// Hook return type
interface UseActivePaymentsReturn<T extends ViewMode> {
  data: ActivePaymentsData<T>;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useActivePayments<T extends ViewMode>({
  viewMode,
  currentPage,
  searchTerm,
}: UseActivePaymentsParams & { viewMode: T }): UseActivePaymentsReturn<T> {
  // Group mode query (transfers)
  const transfersQuery = useGetTransfersQuery(
    {
      page: currentPage,
      limit: 10,
      sort: ESortOrder.DESC,
    },
    {
      skip: viewMode !== 'group',
    }
  );

  // List mode query (transactions)
  const transactionsQuery = useGetTransactionsQuery(
    {
      page: currentPage,
      limit: 10,
      sort: ESortOrder.DESC,
      search: searchTerm || undefined,
    },
    {
      skip: viewMode !== 'list',
    }
  );

  // Return the appropriate query data based on view mode
  return useMemo(() => {
    if (viewMode === 'group') {
      return {
        data: transfersQuery.data as ActivePaymentsData<T>,
        isLoading: transfersQuery.isLoading,
        isFetching: transfersQuery.isFetching,
        refetch: transfersQuery.refetch,
      };
    } else {
      return {
        data: transactionsQuery.data as ActivePaymentsData<T>,
        isLoading: transactionsQuery.isLoading,
        isFetching: transactionsQuery.isFetching,
        refetch: transactionsQuery.refetch,
      };
    }
  }, [viewMode, transfersQuery, transactionsQuery]);
}
