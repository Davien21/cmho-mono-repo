import { ImageIcon } from "lucide-react";
import { GalleryCard, GalleryCardViewMode } from "./GalleryCard";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { IMediaDto } from "@/store/media-slice";

export interface MediaGridProps {
  items: IMediaDto[];
  viewMode: "grid" | "list";
  selectedIds: string[];
  showCheckboxes: boolean;
  showZoomButton?: boolean;
  isLoading?: boolean;
  searchQuery?: string;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  isFetching?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  onSelect: (item: IMediaDto) => void;
  onZoom?: (index: number) => void;
  onEmptyAction?: () => void;
}

export function MediaGrid({
  items,
  viewMode,
  selectedIds,
  showCheckboxes,
  showZoomButton = false,
  isLoading = false,
  searchQuery = "",
  isFetchingNextPage = false,
  hasNextPage = false,
  isFetching = false,
  loadMoreRef,
  onSelect,
  onZoom,
  onEmptyAction,
}: MediaGridProps) {
  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          {searchQuery ? "No media found" : "No media uploaded yet"}
        </p>
        {!searchQuery && onEmptyAction && (
          <Button variant="outline" size="sm" onClick={onEmptyAction}>
            Upload your first file
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Media Grid/List */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            : "flex flex-col gap-2"
        )}
      >
        {items.map((item, index) => (
          <GalleryCard
            key={item._id}
            item={item}
            isSelected={selectedIds.includes(item._id)}
            viewMode={viewMode as GalleryCardViewMode}
            showCheckbox={showCheckboxes}
            showZoomButton={showZoomButton}
            onZoomClick={onZoom ? () => onZoom(index) : undefined}
            checkboxSize="medium"
            onSelect={onSelect}
          />
        ))}
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

      {/* Intersection observer target - only show when there's more to load */}
      {hasNextPage && loadMoreRef && <div ref={loadMoreRef} className="h-20" />}

      {/* End of list indicator - only show when we're done and not fetching */}
      {!hasNextPage && items.length > 0 && !isFetching && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No more images to load
        </div>
      )}
    </div>
  );
}

