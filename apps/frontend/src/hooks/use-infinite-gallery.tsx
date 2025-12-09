import { useMemo, RefObject } from "react";
import {
  useGetGalleryPagesInfiniteQuery,
  IGalleryDto,
} from "@/store/gallery-slice";
import { useInfiniteScrollRTK } from "./use-infinite-scroll-rtk";

interface UseInfiniteGalleryOptions {
  loadMoreRef: RefObject<HTMLElement>;
  limit?: number;
  rootMargin?: string;
  threshold?: number;
}

interface UseInfiniteGalleryReturn {
  galleryItems: IGalleryDto[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  error: unknown;
  loadMoreRef: RefObject<HTMLElement>;
}

/**
 * Hook that combines infinite query and infinite scroll for gallery
 * Automatically handles pagination and data flattening
 */
export function useInfiniteGallery(
  options: UseInfiniteGalleryOptions
): UseInfiniteGalleryReturn {
  const { loadMoreRef, limit, rootMargin = "200px", threshold = 0.1 } = options;

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useGetGalleryPagesInfiniteQuery({
    limit,
  });

  // Flatten all pages into a single array
  const galleryItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data.items);
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
    galleryItems,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    isError,
    error,
    loadMoreRef,
  };
}
