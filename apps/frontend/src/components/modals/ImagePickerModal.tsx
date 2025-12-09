import { useState, useMemo } from "react";
import { Search, Image as ImageIcon } from "lucide-react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetGalleryQuery, IGalleryDto } from "@/store/gallery-slice";
import { useMediaQuery } from "@/hooks/use-media-query";
import { GalleryCard, getDisplayName } from "@/components/GalleryCard";

interface ImagePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (image: IGalleryDto) => void;
}

export function ImagePickerModal({
  open,
  onOpenChange,
  onSelect,
}: ImagePickerModalProps) {
  const isMobile = useMediaQuery("mobile");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { data: galleryResponse, isLoading } = useGetGalleryQuery({
    page: 1,
    limit: 100,
  });

  const galleryItems = galleryResponse?.data?.items || [];

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return galleryItems;
    const query = searchQuery.toLowerCase();
    return galleryItems.filter((item) => {
      const media =
        typeof item.media_id === "object" ? item.media_id : null;
      const storedName = item.name || media?.filename || "";
      const displayName = getDisplayName(storedName);
      const url = item.imageUrl || media?.url || "";
      // Search both stored name (with prefix) and display name (without prefix)
      return (
        storedName.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query) ||
        url.toLowerCase().includes(query)
      );
    });
  }, [galleryItems, searchQuery]);

  const handleSelect = (image: IGalleryDto) => {
    setSelectedImageId((prev) => (prev === image._id ? null : image._id));
  };

  const handleConfirm = () => {
    if (selectedImageId) {
      const selectedImage = galleryItems.find(
        (item) => item._id === selectedImageId
      );
      if (selectedImage) {
        onSelect(selectedImage);
        onOpenChange(false);
        setSelectedImageId(null);
        setSearchQuery("");
      }
    }
  };

  const handleDoubleClick = (image: IGalleryDto) => {
    onSelect(image);
    onOpenChange(false);
    setSelectedImageId(null);
    setSearchQuery("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedImageId(null);
    setSearchQuery("");
  };

  return (
    <ResponsiveDialog.Root open={open} onOpenChange={handleClose}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-2xl w-full max-h-[85vh] flex flex-col">
          <ResponsiveDialog.Header className="px-0 flex-shrink-0">
            <ResponsiveDialog.Title className="text-xl sm:text-2xl font-bold">
              Pick an image
            </ResponsiveDialog.Title>
          </ResponsiveDialog.Header>

          {/* Search Bar - Fixed */}
          <div className="relative flex-shrink-0 mt-4 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Scrollable Image Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Loading images...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  {searchQuery ? "No images found" : "No images available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-2">
                {filteredImages.map((item) => (
                  <GalleryCard
                    key={item._id}
                    item={item}
                    isSelected={selectedImageId === item._id}
                    onSelect={handleSelect}
                    onDoubleClick={handleDoubleClick}
                    viewMode="grid"
                    showCheckbox={true}
                    checkboxSize="small"
                    hoverBehavior={true}
                  />
                ))}
              </div>
            )}
          </div>

          <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-6 border-t px-0 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size={isMobile ? "lg" : "default"}
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size={isMobile ? "lg" : "default"}
              onClick={handleConfirm}
              disabled={!selectedImageId}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800"
            >
              Select
            </Button>
          </ResponsiveDialog.Footer>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}

