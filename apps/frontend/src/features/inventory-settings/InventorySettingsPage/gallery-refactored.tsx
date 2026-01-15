import { useState, useRef, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { useMediaManager } from "@/hooks/use-media-manager";
import { MediaGrid } from "@/components/MediaGrid";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { MediaSearchBar } from "@/components/MediaSearchBar";
import { useInfiniteGallery } from "@/hooks/use-infinite-gallery";
import { MediaCategory } from "@/store/media-slice";
import { cn } from "@/lib/utils";

// Helper function to strip "cmho-temp_" prefix from display name
const getDisplayName = (name?: string): string => {
  if (!name) return "Untitled";
  if (name.startsWith("cmho-temp_")) {
    return name.substring("cmho-temp_".length);
  }
  return name;
};

type ViewMode = "grid" | "list";

export function GallerySection({
  onProcessFilesReady,
}: {
  onProcessFilesReady?: (
    processFiles: (files: File[]) => Promise<void>
  ) => void;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch gallery items with category filter
  const {
    galleryItems: galleryList,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteGallery({
    loadMoreRef,
    limit: 100,
    category: MediaCategory.INVENTORY,
  });

  // Media management hook
  const {
    processFiles,
    handleDelete,
    handleBulkDelete,
    isUploading,
    isDeleting,
    selectedMedia,
    toggleSelection,
    setSelectedMedia,
  } = useMediaManager({
    category: MediaCategory.INVENTORY,
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const slideshowImageRef = useRef<HTMLImageElement>(null);

  // Search filtering
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return galleryList;
    const query = searchQuery.toLowerCase();
    return galleryList.filter((item) => {
      const media = typeof item.media_id === "object" ? item.media_id : null;
      const storedName = item.name || media?.filename || "";
      const displayName = getDisplayName(storedName);
      const url = media?.url || "";
      return (
        storedName.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query) ||
        url.toLowerCase().includes(query)
      );
    });
  }, [galleryList, searchQuery]);

  // Handle item deletion with display name
  const handleItemDelete = (item: typeof galleryList[0]) => {
    const media = typeof item.media_id === "object" ? item.media_id : null;
    const displayName = getDisplayName(item.name || media?.filename || "this image");
    handleDelete(item, displayName);
  };

  // Handle bulk deletion
  const handleBulkDeleteClick = () => {
    const itemsToDelete = galleryList.filter((item) =>
      selectedMedia.includes(item._id)
    );
    handleBulkDelete(itemsToDelete);
  };

  // Toggle checkbox mode and clear selection when hiding
  const handleCheckboxToggle = () => {
    setShowCheckboxes(!showCheckboxes);
    if (showCheckboxes) {
      setSelectedMedia([]);
    }
  };

  // Expose processFiles to parent
  useEffect(() => {
    if (onProcessFilesReady) {
      onProcessFilesReady(processFiles);
    }
  }, [onProcessFilesReady, processFiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (slideshowIndex !== null) {
          setSlideshowIndex(null);
        } else if (selectedMedia.length > 0) {
          setSelectedMedia([]);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedMedia.length, slideshowIndex, setSelectedMedia]);

  // Slideshow navigation
  useEffect(() => {
    if (slideshowIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlideshowIndex((prev) => {
          if (prev === null) return null;
          return prev > 0 ? prev - 1 : filteredMedia.length - 1;
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSlideshowIndex((prev) => {
          if (prev === null) return null;
          return prev < filteredMedia.length - 1 ? prev + 1 : 0;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideshowIndex, filteredMedia.length]);

  // Reset image loading state when slideshow changes
  useEffect(() => {
    if (slideshowIndex !== null) {
      setIsImageLoading(true);
      const timer = setTimeout(() => {
        if (slideshowImageRef.current?.complete) {
          setIsImageLoading(false);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [slideshowIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading media...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <MediaSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showCheckboxes={showCheckboxes}
          onCheckboxToggle={handleCheckboxToggle}
          selectedCount={selectedMedia.length}
          isDeleting={isDeleting}
          onDeleteSelected={selectedMedia.length > 0 ? handleBulkDeleteClick : undefined}
        />

        <MediaUploadZone
          isUploading={isUploading}
          onFilesSelected={processFiles}
        />
      </div>

      {/* Media Grid/List */}
      <MediaGrid
        items={filteredMedia}
        viewMode={viewMode}
        selectedIds={selectedMedia}
        showCheckboxes={showCheckboxes}
        showZoomButton={true}
        isLoading={isLoading}
        searchQuery={searchQuery}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        loadMoreRef={loadMoreRef}
        onSelect={toggleSelection}
        onZoom={(index) => setSlideshowIndex(index)}
        onEmptyAction={() => {
          // Trigger file input click
          document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
        }}
      />

      {/* Full Screen Slideshow Overlay */}
      {slideshowIndex !== null && filteredMedia[slideshowIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setSlideshowIndex(null)}
          />

          {/* Slideshow Content */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setSlideshowIndex(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous Button */}
            {filteredMedia.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideshowIndex((prev) =>
                    prev !== null && prev > 0
                      ? prev - 1
                      : filteredMedia.length - 1
                  );
                }}
                className="absolute left-4 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white"
                title="Previous (←)"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Image Container */}
            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
              {(() => {
                const currentItem = filteredMedia[slideshowIndex];
                const media =
                  typeof currentItem.media_id === "object"
                    ? currentItem.media_id
                    : null;
                const mediaUrl = currentItem.imageUrl || media?.url || "";
                const displayName = getDisplayName(
                  currentItem.name || media?.filename
                );

                return (
                  <div className="relative">
                    {/* Loading Spinner */}
                    {isImageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    <img
                      ref={slideshowImageRef}
                      src={mediaUrl}
                      alt={displayName}
                      className={cn(
                        "max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300",
                        isImageLoading ? "opacity-0" : "opacity-100"
                      )}
                      onLoadStart={() => setIsImageLoading(true)}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)}
                    />

                    {/* Image Info */}
                    {!isImageLoading && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                        <p className="text-white text-sm font-medium truncate">
                          {displayName}
                        </p>
                        <p className="text-white/70 text-xs mt-1">
                          {slideshowIndex + 1} of {filteredMedia.length}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Next Button */}
            {filteredMedia.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideshowIndex((prev) =>
                    prev !== null && prev < filteredMedia.length - 1
                      ? prev + 1
                      : 0
                  );
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white"
                title="Next (→)"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

