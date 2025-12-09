import { useMemo, RefObject } from "react";
import {
  useGetStockMovementPagesInfiniteQuery,
  IStockMovementDto,
  IGetStockMovementQuery,
} from "@/store/inventory-slice";
import { useInfiniteScrollRTK } from "./use-infinite-scroll-rtk";

interface UseInfiniteStockMovementOptions
  extends Omit<IGetStockMovementQuery, "page" | "limit"> {
  loadMoreRef: RefObject<HTMLElement>;
  rootMargin?: string;
  threshold?: number;
}

interface UseInfiniteStockMovementReturn {
  stockMovements: IStockMovementDto[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  error: unknown;
  loadMoreRef: RefObject<HTMLElement>;
}

/**
 * Hook that combines infinite query and infinite scroll for stock movement
 * Automatically handles pagination and data flattening
 */
export function useInfiniteStockMovement(
  options: UseInfiniteStockMovementOptions
): UseInfiniteStockMovementReturn {
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
  } = useGetStockMovementPagesInfiniteQuery(queryParams);

  // Flatten all pages into a single array
  const stockMovements = useMemo(() => {
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
    stockMovements,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    isError,
    error,
    loadMoreRef,
  };
}

