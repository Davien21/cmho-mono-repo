import { useState, useRef, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Search,
  List,
  Grid3x3,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { useMediaManager } from "@/hooks/use-media-manager";
import { GalleryCard, GalleryCardMenuItem } from "@/components/GalleryCard";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { useInfiniteMedia } from "@/hooks/use-infinite-media";
import { MediaCategory } from "@/store/media-slice";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  // Fetch media items with category filter
  const {
    mediaItems: galleryList,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteMedia({
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
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const slideshowImageRef = useRef<HTMLImageElement>(null);

  // Search filtering
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return galleryList;
    const query = searchQuery.toLowerCase();
    return galleryList.filter((item) => {
      // item is IMediaDto directly (no media_id wrapper)
      const storedName = item.name || item.filename || "";
      const displayName = getDisplayName(storedName);
      const url = item.url || "";
      return (
        storedName.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query) ||
        url.toLowerCase().includes(query)
      );
    });
  }, [galleryList, searchQuery]);

  // Handle item selection - adapter to convert IMediaDto to id string
  const handleItemSelect = (item: (typeof galleryList)[0]) => {
    toggleSelection(item._id);
  };

  // Handle bulk deletion
  const handleBulkDeleteClick = () => {
    const itemsToDelete = galleryList.filter((item) =>
      selectedMedia.includes(item._id)
    );
    handleBulkDelete(itemsToDelete);
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
      {galleryList.length > 0 ? (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search and View Toggle */}
          <div className="flex gap-2 items-center flex-1 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              title={viewMode === "grid" ? "List view" : "Grid view"}
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </Button>

            {/* Delete Selected Button */}
            {selectedMedia.length > 0 && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleBulkDeleteClick}
                disabled={isDeleting}
                title={`Delete ${selectedMedia.length} selected`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <MediaUploadZone
            isUploading={isUploading}
            onFilesSelected={processFiles}
          />
        </div>
      ) : (
        <div className="flex justify-end">
          <MediaUploadZone
            isUploading={isUploading}
            onFilesSelected={processFiles}
          />
        </div>
      )}

      {/* Media Grid/List */}
      {filteredMedia.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {searchQuery ? "No media found" : "No media uploaded yet"}
          </p>
          {!searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                document
                  .querySelector<HTMLInputElement>('input[type="file"]')
                  ?.click();
              }}
            >
              Upload your first file
            </Button>
          )}
        </div>
      ) : (
        <div>
          {/* Media Grid/List */}
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "flex flex-col gap-2"
            )}
          >
            {filteredMedia.map((item, index) => {
              const contextMenuItems: GalleryCardMenuItem[] = [
                {
                  label: "Delete",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => {
                    const displayName = getDisplayName(
                      item.name || item.filename || "this image"
                    );
                    handleDelete(item, displayName);
                  },
                  variant: "destructive",
                },
              ];

              return (
                <GalleryCard
                  key={item._id}
                  item={item}
                  isSelected={selectedMedia.includes(item._id)}
                  viewMode={viewMode}
                  showCheckbox={true}
                  showZoomButton={true}
                  onZoomClick={() => setSlideshowIndex(index)}
                  checkboxSize="medium"
                  onSelect={handleItemSelect}
                  contextMenuItems={contextMenuItems}
                />
              );
            })}
          </div>

          {/* Loading indicator at bottom for infinite scroll */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                Loading more images...
              </div>
            </div>
          )}

          {/* Intersection observer target */}
          {hasNextPage && <div ref={loadMoreRef} className="h-20" />}

          {/* End of list indicator */}
          {!hasNextPage && filteredMedia.length > 0 && !isFetching && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No more images to load
            </div>
          )}
        </div>
      )}

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
                // currentItem is IMediaDto directly
                const mediaUrl = currentItem.url || "";
                const displayName = getDisplayName(
                  currentItem.name || currentItem.filename
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
