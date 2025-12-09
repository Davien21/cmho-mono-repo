import { useMemo, RefObject } from "react";
import {
  useGetNotificationsPagesInfiniteQuery,
  INotificationDto,
  IGetNotificationsQuery,
} from "@/store/notifications-slice";
import { useInfiniteScrollRTK } from "./use-infinite-scroll-rtk";

interface UseInfiniteNotificationsOptions
  extends Omit<IGetNotificationsQuery, "page" | "limit"> {
  loadMoreRef: RefObject<HTMLElement>;
  rootMargin?: string;
  threshold?: number;
}

interface UseInfiniteNotificationsReturn {
  notifications: INotificationDto[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  error: unknown;
  loadMoreRef: RefObject<HTMLElement>;
}

/**
 * Hook that combines infinite query and infinite scroll for notifications
 * Automatically handles pagination and data flattening
 */
export function useInfiniteNotifications(
  options: UseInfiniteNotificationsOptions
): UseInfiniteNotificationsReturn {
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
  } = useGetNotificationsPagesInfiniteQuery(queryParams);

  // Flatten all pages into a single array
  const notifications = useMemo(() => {
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
    notifications,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    isError,
    error,
    loadMoreRef,
  };
}

