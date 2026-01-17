import { useState, useRef } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Loader2,
  Image as ImageIcon,
  MousePointer2,
  Scale,
  Plus,
  CheckSquare,
  Trash2,
} from "lucide-react";
import { processInBatches, optimizeImage } from "@/lib/image-utils";
import {
  useGetStagedItemsQuery,
  useProcessInventoryBalanceMutation,
} from "@/store/inventory-balances-slice";
import {
  useGetMediaQuery,
  MediaCategory,
  useDeleteMediaMutation,
  useUploadMediaMutation,
} from "@/store/media-slice";
import { GalleryCard } from "@/components/GalleryCard";
import { useModalContext } from "@/contexts/modal-context";

interface ProcessedImage {
  id?: string;
  name: string;
  url: string;
}

export default function BalanceStockPage() {
  const [selectedFiles, setSelectedFiles] = useState<ProcessedImage[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RTK Query
  const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation();
  const [processBalance] = useProcessInventoryBalanceMutation();
  const [deleteMedia, { isLoading: isDeleting }] = useDeleteMediaMutation();
  const { data: stagedData } = useGetStagedItemsQuery();
  const { data: mediaData, isLoading: isLoadingMedia } = useGetMediaQuery({
    category: MediaCategory.BALANCE_SHEET,
  });
  const { openModal, updateModal, closeModal } = useModalContext();

  // All media items with processing status
  const allMediaWithStatus = (mediaData?.data.items || []).map((media) => {
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

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const toastId = toast.loading(`Uploading ${files.length} image(s)...`);

    try {
      // Moderate optimization for AI processing: balances quality and upload speed
      // Higher thresholds than gallery to preserve text clarity for OCR
      const optimizationResults = await processInBatches(files, 4, (file) =>
        optimizeImage(file, {
          sizeThreshold: 500 * 1024, // 500KB - allow larger files before optimization
          dimensionThreshold: 2000, // Larger dimensions for text clarity
          quality: 0.92, // High quality for text recognition
          targetSizeKB: 800, // Target 800KB after first pass
        })
      );

      const optimizedFiles: File[] = [];
      optimizationResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          optimizedFiles.push(result.value);
        } else {
          toast.error(`Failed to process ${files[index].name}`);
        }
      });

      if (optimizedFiles.length === 0) {
        toast.dismiss(toastId);
        return;
      }

      const uploadResults = await processInBatches(
        optimizedFiles,
        4,
        async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", MediaCategory.BALANCE_SHEET);
          const response = await uploadMedia({
            formData,
          }).unwrap();
          return response.data;
        }
      );

      let successCount = 0;
      const uploadedMediaIds: string[] = [];
      uploadResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
          uploadedMediaIds.push(result.value._id);
        } else {
          toast.error(`Failed to upload ${optimizedFiles[index].name}`);
        }
      });

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} image(s)`, {
          id: toastId,
        });

        // Auto-select newly uploaded images and enable checkbox mode
        setSelectedMediaIds(uploadedMediaIds);
        setShowCheckboxes(true);
      } else {
        toast.error("All uploads failed", { id: toastId });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Failed to upload images", { id: toastId });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    handleUpload(files);
  };

  const handleProcessImages = async (filesToProcess: ProcessedImage[]) => {
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
        setSelectedFiles([]);

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

  const handleDeleteSelected = () => {
    const totalSelected = selectedMediaIds.length;
    if (totalSelected === 0) return;

    const itemText = totalSelected === 1 ? "image" : "images";

    openModal("confirmation-dialog", {
      title: "Delete images",
      message: `Are you sure you want to delete these ${totalSelected} ${itemText}? This action cannot be undone.`,
      type: "danger",
      isLoading: false,
      onConfirm: async () => {
        // Update modal to show loading state
        updateModal("confirmation-dialog", {
          isLoading: true,
          onConfirm: () => {},
        });

        try {
          const deletePromises = selectedMediaIds.map((mediaId) =>
            deleteMedia(mediaId).unwrap()
          );

          await Promise.all(deletePromises);

          toast.success(`${totalSelected} ${itemText} deleted successfully`, {
            duration: 3000,
          });
          setSelectedMediaIds([]);
          setShowCheckboxes(false);
          closeModal("confirmation-dialog");
        } catch (error: any) {
          const message =
            error?.data?.message ||
            "Failed to delete images. Please try again.";
          toast.error(message);
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  return (
    <Layout>
      <div
        className="relative min-h-[calc(100vh-120px)] flex flex-col gap-6"
        onDragOver={onDragOver}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-xl m-4"
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center gap-4 text-blue-600 bg-white p-8 rounded-2xl shadow-xl">
              <Upload className="h-12 w-12 animate-bounce" />
              <p className="text-xl font-semibold">Drop images to upload</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Balance Stock</h1>
            <p className="text-muted-foreground">
              Upload or pick product images to automatically extract inventory
              data using AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                setShowCheckboxes(!showCheckboxes);
                if (showCheckboxes) {
                  // When hiding checkboxes, clear selection
                  setSelectedMediaIds([]);
                }
              }}
              disabled={isProcessing}
              title={showCheckboxes ? "Exit select mode" : "Select items"}
            >
              {showCheckboxes ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <MousePointer2 className="h-4 w-4" />
              )}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedMediaIds.length > 0 ? (
              <>
                {/* Check if any selected items are unprocessed */}
                {allMediaWithStatus.some(
                  ({ media, isProcessed }) =>
                    selectedMediaIds.includes(media._id) && !isProcessed
                ) && (
                  <Button
                    onClick={async () => {
                      // Convert selected unprocessed media to ProcessedImage format
                      const filesToProcess = allMediaWithStatus
                        .filter(
                          ({ media, isProcessed }) =>
                            selectedMediaIds.includes(media._id) && !isProcessed
                        )
                        .map(({ media }) => ({
                          id: media._id,
                          url: media.url,
                          name: media.filename,
                        }));
                      setSelectedMediaIds([]);
                      setShowCheckboxes(false);

                      // Process the selected files
                      await handleProcessImages(filesToProcess);
                    }}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Scale className="h-4 w-4 mr-2" />
                    )}
                    Process {selectedMediaIds.length === 1 ? "image" : "images"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  title={`Delete ${selectedMediaIds.length} selected`}
                  className="h-10 w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Upload File
              </Button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedFiles.length === 0 ? (
            <>
              {allMediaWithStatus.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {isLoadingMedia ? (
                    <div className="col-span-full py-10 flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading balance sheets...
                    </div>
                  ) : (
                    allMediaWithStatus.map(
                      ({ media, isProcessed, stagedItems }) => (
                        <GalleryCard
                          key={media._id}
                          item={media}
                          isSelected={selectedMediaIds.includes(media._id)}
                          viewMode="grid"
                          showCheckbox={showCheckboxes}
                          showZoomButton={isProcessed}
                          checkboxSize="medium"
                          showProcessedIndicator={isProcessed}
                          onSelect={(item) => {
                            const isCurrentlySelected =
                              selectedMediaIds.includes(item._id);
                            setSelectedMediaIds((prev) =>
                              isCurrentlySelected
                                ? prev.filter((id) => id !== item._id)
                                : [...prev, item._id]
                            );
                          }}
                          onDoubleClick={
                            isProcessed
                              ? () => {
                                  // Open preview modal with staged items
                                  openModal("ai-preview", {
                                    imageUrl: media.url,
                                    items: stagedItems.map((item) => ({
                                      name: item.name,
                                      quantity_details: item.quantity_details,
                                    })),
                                  });
                                }
                              : undefined
                          }
                          onZoomClick={
                            isProcessed
                              ? () => window.open(media.url, "_blank")
                              : undefined
                          }
                        />
                      )
                    )
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-muted/5">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    No balance sheets found. Upload new images to start
                    processing.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={file.id || index}
                  className="relative aspect-square rounded-xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] text-white text-[10px] p-2 truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
