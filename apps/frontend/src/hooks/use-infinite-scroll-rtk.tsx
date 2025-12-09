import { useEffect, RefObject } from "react";

interface UseInfiniteScrollRTKOptions {
  /**
   * Ref to the element that triggers loading when it becomes visible
   */
  loadMoreRef: RefObject<HTMLElement>;
  /**
   * Whether there are more pages to load (from RTK Query infinite query)
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
   * Function to fetch the next page (from RTK Query infinite query)
   */
  fetchNextPage: () => void;
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
 * Hook to handle infinite scroll using Intersection Observer with RTK Query infinite queries
 * Automatically loads more data when the target element becomes visible
 */
export function useInfiniteScrollRTK({
  loadMoreRef,
  hasNextPage,
  isFetching,
  isLoading = false,
  fetchNextPage,
  rootMargin = "200px",
  threshold = 0.1,
}: UseInfiniteScrollRTKOptions) {
  useEffect(() => {
    if (!hasNextPage || isLoading || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // Only trigger if element is actually intersecting (not just within rootMargin)
        // This prevents immediate triggers when limit is very small (e.g., 1)
        if (
          target.isIntersecting &&
          hasNextPage &&
          !isFetching &&
          !isLoading
        ) {
          fetchNextPage();
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
    fetchNextPage,
    rootMargin,
    threshold,
    loadMoreRef,
  ]);
}

