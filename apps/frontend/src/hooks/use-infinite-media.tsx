import { useMemo, RefObject, useState, useCallback } from "react";
import {
  useGetMediaPagesInfiniteQuery,
  IMediaDto,
  MediaCategory,
} from "@/store/media-slice";
import { useInfiniteScrollRTK } from "./use-infinite-scroll-rtk";

interface UseInfiniteMediaOptions {
  loadMoreRef: RefObject<HTMLElement>;
  limit?: number;
  category?: MediaCategory;
  rootMargin?: string;
  threshold?: number;
}

interface UseInfiniteMediaReturn {
  mediaItems: IMediaDto[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  error: unknown;
  loadMoreRef: RefObject<HTMLElement>;
}

/**
 * Hook that combines infinite query and infinite scroll for media
 * Automatically handles pagination and data flattening
 *
 * Replaces: useInfiniteGallery
 */
export function useInfiniteMedia(
  options: UseInfiniteMediaOptions
): UseInfiniteMediaReturn {
  const {
    loadMoreRef,
    limit = 100,
    category,
    rootMargin = "200px",
    threshold = 0.1,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch current page
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetMediaPagesInfiniteQuery({
    limit,
    category,
    page: currentPage,
  });

  // Extract items and meta from response
  const mediaItems = useMemo(() => {
    if (!data?.data?.items) return [];
    return data.data.items;
  }, [data]);

  const hasNextPage = data?.data?.meta?.hasNextPage ?? false;

  // Fetch next page function
  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage, isFetching]);

  // Infinite scroll using Intersection Observer
  useInfiniteScrollRTK({
    loadMoreRef,
    hasNextPage,
    isFetching,
    isLoading,
    fetchNextPage,
    rootMargin,
    threshold,
  });

  return {
    mediaItems,
    isLoading,
    isFetching,
    isFetchingNextPage: isFetching && currentPage > 1,
    hasNextPage,
    isError,
    error,
    loadMoreRef,
  };
}

