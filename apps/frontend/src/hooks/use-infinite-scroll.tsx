import { useEffect, RefObject } from "react";

interface UseInfiniteScrollOptions {
  /**
   * Ref to the element that triggers loading when it becomes visible
   */
  loadMoreRef: RefObject<HTMLElement>;
  /**
   * Whether there are more pages to load
   */
  hasNextPage: boolean;
  /**
   * Whether data is currently being fetched
   */
  isFetching: boolean;
  /**
   * Whether data is currently loading (initial load)
   */
  isLoading?: boolean;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Callback to load the next page
   */
  onLoadMore: () => void;
  /**
   * Optional ref to track if a load is already in progress (prevents duplicate calls)
   */
  isLoadingMoreRef?: React.MutableRefObject<boolean>;
  /**
   * Root margin for the Intersection Observer (default: "200px")
   */
  rootMargin?: string;
  /**
   * Threshold for the Intersection Observer (default: 0.1)
   */
  threshold?: number;
}

/**
 * Hook to handle infinite scroll using Intersection Observer
 * Automatically loads more data when the target element becomes visible
 */
export function useInfiniteScroll({
  loadMoreRef,
  hasNextPage,
  isFetching,
  isLoading = false,
  totalPages,
  onLoadMore,
  isLoadingMoreRef,
  rootMargin = "200px",
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (!hasNextPage || isLoading || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasNextPage &&
          !isFetching &&
          (!isLoadingMoreRef || !isLoadingMoreRef.current)
        ) {
          if (isLoadingMoreRef) {
            isLoadingMoreRef.current = true;
          }
          onLoadMore();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    hasNextPage,
    isFetching,
    isLoading,
    totalPages,
    onLoadMore,
    isLoadingMoreRef,
    rootMargin,
    threshold,
    loadMoreRef,
  ]);
}
