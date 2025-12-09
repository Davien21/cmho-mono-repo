import { useMemo, RefObject } from "react";
import {
  useGetActivitiesPagesInfiniteQuery,
  IActivityRecordDto,
  IGetActivitiesQuery,
} from "@/store/activity-slice";
import { useInfiniteScrollRTK } from "./use-infinite-scroll-rtk";

interface UseInfiniteActivitiesOptions
  extends Omit<IGetActivitiesQuery, "page" | "limit"> {
  loadMoreRef: RefObject<HTMLElement>;
  rootMargin?: string;
  threshold?: number;
}

interface UseInfiniteActivitiesReturn {
  activities: IActivityRecordDto[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  error: unknown;
  loadMoreRef: RefObject<HTMLElement>;
}

/**
 * Hook that combines infinite query and infinite scroll for activities
 * Automatically handles pagination and data flattening
 */
export function useInfiniteActivities(
  options: UseInfiniteActivitiesOptions
): UseInfiniteActivitiesReturn {
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
  } = useGetActivitiesPagesInfiniteQuery(queryParams);

  // Flatten all pages into a single array
  const activities = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data.data);
  }, [data]);

  // Infinite scroll using Intersection Observer
  useInfiniteScrollRTK({
    loadMoreRef,
    hasNextPage,
    isFetching: isFetchingNextPage,
    isLoading,
    fetchNextPage,
    rootMargin,
    threshold,
  });

  return {
    activities,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    isError,
    error,
    loadMoreRef,
  };
}
