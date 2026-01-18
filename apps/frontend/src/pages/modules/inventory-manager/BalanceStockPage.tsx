import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, Scale, Trash2 } from "lucide-react";
import { processInBatches } from "@/lib/image-utils";
import {
  useGetStagedItemsQuery,
  useProcessInventoryBalanceMutation,
} from "@/store/inventory-balances-slice";
import { MediaCategory } from "@/store/media-slice";
import { useModalContext } from "@/contexts/modal-context";
import { useInfiniteMedia } from "@/hooks/use-infinite-media";
import { useMediaManager } from "@/hooks/use-media-manager";
import { GalleryCard, GalleryCardMenuItem } from "@/components/GalleryCard";
import { MediaUploadZone } from "@/components/MediaUploadZone";

export default function BalanceStockPage() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { openModal } = useModalContext();

  // Fetch media items with infinite scroll
  const {
    mediaItems: galleryList,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteMedia({
    loadMoreRef,
    limit: 100,
    category: MediaCategory.BALANCE_SHEET,
  });

  // Media management hook
  const {
    processFiles,
    handleBulkDelete,
    isUploading,
    isDeleting,
    selectedMedia,
    toggleSelection,
    setSelectedMedia,
  } = useMediaManager({
    category: MediaCategory.BALANCE_SHEET,
  });

  // AI Processing
  const [processBalance] = useProcessInventoryBalanceMutation();
  const { data: stagedData } = useGetStagedItemsQuery();

  // All media items with processing status
  const allMediaWithStatus = useMemo(() => {
    return galleryList.map((media) => {
      const hasProcessedItems = stagedData?.data.items.some(
        (staged) => staged.media.id === media._id
      );
      const stagedItems =
        stagedData?.data.items.filter(
          (staged) => staged.media.id === media._id
        ) || [];

      return {
        media,
        isProcessed: hasProcessedItems,
        stagedItems,
      };
    });
  }, [galleryList, stagedData]);

  // Handle item selection
  const handleItemSelect = (item: (typeof galleryList)[0]) => {
    toggleSelection(item._id);
  };

  // Handle double click to open AI preview modal
  const handleDoubleClick = (item: (typeof galleryList)[0]) => {
    const mediaWithStatus = allMediaWithStatus.find(
      ({ media }) => media._id === item._id
    );

    if (mediaWithStatus?.isProcessed) {
      openModal("ai-preview", {
        imageUrl: item.url,
        items: mediaWithStatus.stagedItems.map((staged) => ({
          name: staged.name,
          quantity_details: staged.quantity_details,
        })),
      });
    }
  };

  // Process selected unprocessed images with AI
  const handleProcessSelected = async () => {
    // Get selected unprocessed media
    const filesToProcess = allMediaWithStatus
      .filter(
        ({ media, isProcessed }) =>
          selectedMedia.includes(media._id) && !isProcessed
      )
      .map(({ media }) => ({
        id: media._id,
        url: media.url,
        name: media.filename,
      }));

    if (filesToProcess.length === 0) return;

    setIsProcessing(true);
    const toastId = toast.loading("Processing images with AI...");

    try {
      const results = await processInBatches(
        filesToProcess,
        2,
        async (fileObj) => {
          if (!fileObj.id || !fileObj.url) {
            throw new Error("Media ID and URL are required");
          }

          const result = await processBalance({
            media_id: fileObj.id,
            imageUrl: fileObj.url,
          }).unwrap();
          return result.data;
        }
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;

      if (successCount > 0) {
        toast.success(
          `Successfully processed ${successCount} image(s)! You can now review them (marked with checkmark).`,
          { id: toastId }
        );
        setSelectedMedia([]);

        // Show preview modal for the first successfully processed image
        const firstSuccess = results.find((r) => r.status === "fulfilled");
        if (firstSuccess && firstSuccess.status === "fulfilled") {
          const processedData = firstSuccess.value;
          openModal("ai-preview", {
            imageUrl: processedData.media.url,
            items: processedData.items.map((item) => ({
              name: item.name,
              quantity_details: item.quantity_details,
            })),
          });
        }
      } else {
        toast.error("Failed to process images", { id: toastId });
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to process images", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk delete
  const handleDeleteSelected = () => {
    const itemsToDelete = galleryList.filter((item) =>
      selectedMedia.includes(item._id)
    );
    handleBulkDelete(itemsToDelete);
  };

  // Check if any selected items are unprocessed
  const hasUnprocessedSelected = allMediaWithStatus.some(
    ({ media, isProcessed }) =>
      selectedMedia.includes(media._id) && !isProcessed
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">
            Loading balance sheets...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Balance Stock</h1>
          <p className="text-muted-foreground">
            Upload balance sheet images to automatically extract inventory data
            using AI.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Empty space for layout consistency (where search would be) */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Delete Selected Button */}
            {selectedMedia.length > 0 && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                title={`Delete ${selectedMedia.length} selected`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Process Button - shown when unprocessed items are selected */}
            {selectedMedia.length > 0 && hasUnprocessedSelected && (
              <Button
                onClick={handleProcessSelected}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Scale className="h-4 w-4 mr-2" />
                )}
                Process
              </Button>
            )}

            {/* Upload Button - Always visible */}
            <MediaUploadZone
              isUploading={isUploading}
              onFilesSelected={processFiles}
            />
          </div>
        </div>

        {/* Media Grid/List */}
        {allMediaWithStatus.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              No balance sheets uploaded yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                document
                  .querySelector<HTMLInputElement>('input[type="file"]')
                  ?.click()
              }
            >
              Upload your first file
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allMediaWithStatus.map(({ media, isProcessed }) => {
                const contextMenuItems: GalleryCardMenuItem[] = [
                  {
                    label: "Delete",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => {
                      handleBulkDelete([media]);
                    },
                    variant: "destructive",
                  },
                ];

                // Add Process option if not processed
                if (!isProcessed) {
                  contextMenuItems.unshift({
                    label: "Process with AI",
                    icon: <Scale className="h-4 w-4" />,
                    onClick: async () => {
                      setIsProcessing(true);
                      const toastId = toast.loading(
                        "Processing image with AI..."
                      );
                      try {
                        const result = await processBalance({
                          media_id: media._id,
                          imageUrl: media.url,
                        }).unwrap();
                        toast.success("Image processed successfully!", {
                          id: toastId,
                        });

                        // Show preview modal for the processed image
                        if (result.data) {
                          openModal("ai-preview", {
                            imageUrl: result.data.media.url,
                            items: result.data.items.map((item) => ({
                              name: item.name,
                              quantity_details: item.quantity_details,
                            })),
                          });
                        }
                      } catch (error: any) {
                        toast.error(
                          error?.message || "Failed to process image",
                          { id: toastId }
                        );
                      } finally {
                        setIsProcessing(false);
                      }
                    },
                  });
                }

                return (
                  <GalleryCard
                    key={media._id}
                    item={media}
                    isSelected={selectedMedia.includes(media._id)}
                    viewMode="grid"
                    showCheckbox={true}
                    showZoomButton={false}
                    checkboxSize="medium"
                    showProcessedIndicator={isProcessed}
                    onSelect={handleItemSelect}
                    onDoubleClick={isProcessed ? handleDoubleClick : undefined}
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
            {!hasNextPage && allMediaWithStatus.length > 0 && !isFetching && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more images to load
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
