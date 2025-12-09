import { useMemo, RefObject } from "react";
import {
  useGetStockEntriesPagesInfiniteQuery,
  IStockEntryDto,
  IGetStockEntriesQuery,
} from "@/store/inventory-slice";
import { useInfiniteScrollRTK } from "./use-infinite-scroll-rtk";

interface UseInfiniteStockEntriesOptions
  extends Omit<IGetStockEntriesQuery, "page" | "limit"> {
  loadMoreRef: RefObject<HTMLElement>;
  rootMargin?: string;
  threshold?: number;
}

interface UseInfiniteStockEntriesReturn {
  stockEntries: IStockEntryDto[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  error: unknown;
  loadMoreRef: RefObject<HTMLElement>;
}

/**
 * Hook that combines infinite query and infinite scroll for stock entries
 * Automatically handles pagination and data flattening
 */
export function useInfiniteStockEntries(
  options: UseInfiniteStockEntriesOptions
): UseInfiniteStockEntriesReturn {
  const {
    loadMoreRef,
    rootMargin = "200px",
    threshold = 0.1,
    ...queryParams
  } = options;

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useGetStockEntriesPagesInfiniteQuery(queryParams);

  // Flatten all pages into a single array
  const stockEntries = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data.data);
  }, [data]);

  // Infinite scroll using Intersection Observer
  useInfiniteScrollRTK({
    loadMoreRef,
    hasNextPage: hasNextPage ?? false,
    isFetching: isFetchingNextPage,
    isLoading,
    fetchNextPage,
    rootMargin,
    threshold,
  });

  return {
    stockEntries,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    isError,
    error,
    loadMoreRef,
  };
}
