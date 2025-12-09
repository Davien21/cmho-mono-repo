import { useState } from "react";
import { Image as ImageIcon, Check, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { IGalleryDto } from "@/store/gallery-slice";

// Helper function to strip "cmho-temp_" prefix from display name
export const getDisplayName = (name?: string): string => {
  if (!name) return "Untitled";
  if (name.startsWith("cmho-temp_")) {
    return name.substring("cmho-temp_".length);
  }
  return name;
};

export type GalleryCardViewMode = "grid" | "list";

export interface GalleryCardProps {
  item: IGalleryDto;
  isSelected: boolean;
  onSelect: (item: IGalleryDto) => void;
  viewMode?: GalleryCardViewMode;
  showCheckbox?: boolean;
  showZoomButton?: boolean;
  onZoomClick?: () => void;
  checkboxSize?: "small" | "medium";
  hoverBehavior?: boolean; // Show checkbox on hover (desktop only)
  onDoubleClick?: (item: IGalleryDto) => void;
}

export function GalleryCard({
  item,
  isSelected,
  onSelect,
  viewMode = "grid",
  showCheckbox = true,
  showZoomButton = false,
  onZoomClick,
  checkboxSize = "small",
  hoverBehavior = false,
  onDoubleClick,
}: GalleryCardProps) {
  const [imageError, setImageError] = useState(false);
  const media =
    typeof item.media_id === "object" ? item.media_id : null;
  const mediaUrl = item.imageUrl || media?.url || "";
  const displayName = getDisplayName(item.name || media?.filename);
  const mediaType = media?.type || "";

  const isImage =
    (mediaType?.toLowerCase().includes("image") ||
      mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) &&
    !imageError;

  const checkboxSizeClasses =
    checkboxSize === "medium"
      ? "h-8 w-8 sm:h-7 sm:w-7"
      : "h-6 w-6";
  const checkIconSize = checkboxSize === "medium" ? "h-4 w-4 sm:h-3.5 sm:w-3.5" : "h-3.5 w-3.5";

  const handleClick = () => {
    onSelect(item);
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  };

  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden border transition-all",
        viewMode === "grid" ? "aspect-square" : "flex items-center gap-3 p-2",
        showCheckbox && "cursor-pointer"
      )}
      onClick={showCheckbox ? handleClick : undefined}
      onDoubleClick={onDoubleClick ? handleDoubleClick : undefined}
    >
      {/* Dark overlay on selection */}
      {isSelected && (
        <div className="absolute inset-0 bg-black/40 z-[5] rounded-lg transition-opacity" />
      )}

      {/* Selection Indicator */}
      {showCheckbox && (
        <div
          className={cn(
            "absolute top-2 left-2 z-10 flex transition-opacity",
            hoverBehavior
              ? // On mobile: only show when selected, On desktop: show on hover or when selected
                "opacity-0 md:group-hover:opacity-100"
              : // Always show when checkbox is enabled
                "opacity-100",
            isSelected && "opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <div
            className={cn(
              checkboxSizeClasses,
              "rounded-md bg-white/20 backdrop-blur-md border-2 border-white/80 flex items-center justify-center transition-all",
              isSelected && "bg-white/40"
            )}
          >
            {isSelected && (
              <Check className={cn(checkIconSize, "text-black")} />
            )}
          </div>
        </div>
      )}

      {/* Image/Preview */}
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-muted",
          viewMode === "list" && "w-16 h-16 flex-shrink-0 rounded"
        )}
      >
        {isImage ? (
          <img
            src={mediaUrl}
            alt={displayName}
            className={cn(
              "object-cover w-full h-full",
              viewMode === "grid" ? "rounded-lg" : "rounded"
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <ImageIcon
              className={cn(
                "text-muted-foreground",
                viewMode === "list" ? "h-8 w-8" : "h-6 w-6"
              )}
            />
          </div>
        )}
      </div>

      {/* Filename */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate",
          viewMode === "list" &&
            "static bg-transparent text-foreground flex-1 min-w-0",
          showZoomButton && viewMode === "grid" && "flex items-center justify-between gap-2",
          viewMode === "list" && "flex items-center justify-between gap-2"
        )}
      >
        <span className="truncate flex-1">{displayName}</span>
        {showZoomButton && onZoomClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onZoomClick();
            }}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            title="View full screen"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

