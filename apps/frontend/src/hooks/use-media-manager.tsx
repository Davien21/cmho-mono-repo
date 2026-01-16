import { useState, useCallback } from "react";
import { toast } from "sonner";
import { processInBatches, optimizeImage } from "@/lib/image-utils";
import {
  useUploadMediaMutation,
  useDeleteMediaMutation,
  IMediaDto,
  MediaCategory,
} from "@/store/media-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { useModalContext } from "@/contexts/modal-context";

export interface UseMediaManagerOptions {
  category?: MediaCategory;
  onUploadSuccess?: (uploadedItems: IMediaDto[]) => void;
  onDeleteSuccess?: (deletedId: string) => void;
  onBulkDeleteSuccess?: (deletedIds: string[]) => void;
}

export interface FailedFile {
  file: File;
  preview: string;
  error: string;
}

export function useMediaManager(options: UseMediaManagerOptions = {}) {
  const [uploadMedia] = useUploadMediaMutation();
  const [deleteMedia, { isLoading: isDeleting }] = useDeleteMediaMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const { openModal, closeModal } = useModalContext();

  /**
   * Process and upload files with validation, optimization, and batch processing
   */
  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // File validation constants
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/png",
        "image/heic",
      ];
      const allowedExtensions = [".jpeg", ".jpg", ".webp", ".png", ".heic"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      // Validate file types
      const invalidTypeFiles = files.filter((file) => {
        const fileExtension = file.name
          .toLowerCase()
          .substring(file.name.lastIndexOf("."));
        const isValidType =
          allowedTypes.includes(file.type.toLowerCase()) ||
          allowedExtensions.includes(fileExtension);
        return !isValidType;
      });

      // Validate file sizes
      const oversizedFiles = files.filter((file) => file.size > maxSize);

      // Show validation errors
      if (invalidTypeFiles.length > 0 || oversizedFiles.length > 0) {
        const validationFailedFiles: FailedFile[] = [];

        invalidTypeFiles.forEach((file) => {
          const preview = URL.createObjectURL(file);
          validationFailedFiles.push({
            file,
            preview,
            error:
              "Unsupported format. Only JPEG, JPG, PNG, WEBP, and HEIC files are allowed.",
          });
        });

        oversizedFiles.forEach((file) => {
          const preview = URL.createObjectURL(file);
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          validationFailedFiles.push({
            file,
            preview,
            error: `File size is ${fileSizeMB}MB and exceeds the 10MB limit.`,
          });
        });

        const totalFailed = validationFailedFiles.length;
        toast.error(
          `${totalFailed} ${
            totalFailed === 1 ? "file" : "files"
          } failed validation`,
          {
            duration: Infinity,
            action: {
              label: "View",
              onClick: () => {
                openModal("failed-uploads", {
                  failedFiles: validationFailedFiles,
                });
              },
            },
            onDismiss: () => {
              validationFailedFiles.forEach((item) => {
                URL.revokeObjectURL(item.preview);
              });
            },
          }
        );

        return;
      }

      const fileCount = files.length;
      const fileText = fileCount === 1 ? "image" : "images";

      // Show loading toast
      const toastId = toast.loading(`Uploading ${fileCount} ${fileText}...`, {
        duration: Infinity,
      });

      setIsUploading(true);

      try {
        // Optimize images before uploading - process in batches of 8
        const BATCH_SIZE = 8;
        const optimizationResults = await processInBatches(
          files,
          BATCH_SIZE,
          (file) => optimizeImage(file)
        );

        // Separate successfully optimized files from failed optimizations
        const optimizedFiles: File[] = [];
        const optimizationFailedFiles: FailedFile[] = [];

        optimizationResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            optimizedFiles.push(result.value);
          } else {
            const file = files[index];
            const preview = URL.createObjectURL(file);
            const errorMessage =
              result.reason?.message || "Optimization failed";
            optimizationFailedFiles.push({
              file,
              preview,
              error: errorMessage,
            });
          }
        });

        // Upload successfully optimized files in batches of 8
        const uploadResults = await processInBatches(
          optimizedFiles,
          BATCH_SIZE,
          (file) => {
            const formData = new FormData();
            formData.append("file", file);
            if (options.category) {
              formData.append("category", options.category);
            }
            return uploadMedia({ formData }).unwrap();
          }
        );

        // Collect failed uploads and successful uploads
        const uploadFailedFiles: FailedFile[] = [];
        const successfulUploads: IMediaDto[] = [];

        uploadResults.forEach((result, index) => {
          if (result.status === "rejected") {
            const file = optimizedFiles[index];
            const preview = URL.createObjectURL(file);
            const errorMessage =
              getRTKQueryErrorMessage(result.reason, "Upload failed") ||
              "Upload failed";
            uploadFailedFiles.push({ file, preview, error: errorMessage });
          } else {
            successfulUploads.push(result.value.data);
          }
        });

        // Combine optimization failures and upload failures
        const failedFiles: FailedFile[] = [
          ...optimizationFailedFiles,
          ...uploadFailedFiles,
        ];
        const successCount = successfulUploads.length;

        // Show appropriate message based on results
        if (failedFiles.length === 0) {
          // All succeeded
          toast.success(`${fileCount} ${fileText} uploaded successfully`, {
            id: toastId,
            duration: 5000,
          });
          if (options.onUploadSuccess) {
            options.onUploadSuccess(successfulUploads);
          }
        } else if (successCount === 0) {
          // All failed
          toast.error(
            `${failedFiles.length} ${
              failedFiles.length === 1 ? "file" : "files"
            } failed to upload`,
            {
              id: toastId,
              duration: Infinity,
              action: {
                label: "View",
                onClick: () => {
                  openModal("failed-uploads", { failedFiles });
                },
              },
              onDismiss: () => {
                failedFiles.forEach((item) => {
                  URL.revokeObjectURL(item.preview);
                });
              },
            }
          );
        } else {
          // Partial success
          toast.warning(
            `${successCount} ${
              successCount === 1 ? "file" : "files"
            } uploaded successfully. ${failedFiles.length} ${
              failedFiles.length === 1 ? "file" : "files"
            } failed`,
            {
              id: toastId,
              duration: Infinity,
              action: {
                label: "View Failed",
                onClick: () => {
                  openModal("failed-uploads", { failedFiles });
                },
              },
              onDismiss: () => {
                failedFiles.forEach((item) => {
                  URL.revokeObjectURL(item.preview);
                });
              },
            }
          );
          if (options.onUploadSuccess) {
            options.onUploadSuccess(successfulUploads);
          }
        }
      } catch (error: unknown) {
        const message = getRTKQueryErrorMessage(
          error,
          "Failed to upload files. Please try again."
        );
        toast.error(message, { id: toastId, duration: Infinity });
      } finally {
        setIsUploading(false);
      }
    },
    [uploadMedia, openModal, options]
  );

  /**
   * Delete a single media item with confirmation
   */
  const handleDelete = useCallback(
    async (mediaItem: IMediaDto, displayName: string) => {
      openModal("confirmation-dialog", {
        title: "Delete image",
        message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
        type: "danger",
        isLoading: false,
        onConfirm: async () => {
          // Update modal to show loading state
          openModal("confirmation-dialog", {
            title: "Delete image",
            message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
            type: "danger",
            isLoading: true,
            onConfirm: async () => {},
            onCancel: () => {},
          });

          try {
            await deleteMedia(mediaItem._id).unwrap();
            toast.success("Image deleted successfully", {
              duration: 3000,
            });
            setSelectedMedia((prev) =>
              prev.filter((id) => id !== mediaItem._id)
            );
            closeModal("confirmation-dialog");
            if (options.onDeleteSuccess) {
              options.onDeleteSuccess(mediaItem._id);
            }
          } catch (error: unknown) {
            const message = getRTKQueryErrorMessage(
              error,
              "Failed to delete image. Please try again."
            );
            toast.error(message);
            // Re-open modal without loading state so user can try again
            openModal("confirmation-dialog", {
              title: "Delete image",
              message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
              type: "danger",
              isLoading: false,
              onConfirm: () => handleDelete(mediaItem, displayName),
              onCancel: () => closeModal("confirmation-dialog"),
            });
          }
        },
        onCancel: () => closeModal("confirmation-dialog"),
      });
    },
    [deleteMedia, openModal, closeModal, options]
  );

  /**
   * Delete multiple selected media items with confirmation
   */
  const handleBulkDelete = useCallback(
    async (itemsToDelete: IMediaDto[]) => {
      if (selectedMedia.length === 0) return;

      const count = selectedMedia.length;
      const itemText = count === 1 ? "image" : "images";

      openModal("confirmation-dialog", {
        title: "Delete images",
        message: `Are you sure you want to delete these ${count} ${itemText}? This action cannot be undone.`,
        type: "danger",
        isLoading: false,
        onConfirm: async () => {
          // Update modal to show loading state
          openModal("confirmation-dialog", {
            title: "Delete images",
            message: `Are you sure you want to delete these ${count} ${itemText}? This action cannot be undone.`,
            type: "danger",
            isLoading: true,
            onConfirm: async () => {},
            onCancel: () => {},
          });

          try {
            await Promise.all(
              itemsToDelete.map((item) => deleteMedia(item._id).unwrap())
            );
            toast.success(`${count} ${itemText} deleted successfully`, {
              duration: 3000,
            });
            setSelectedMedia([]);
            closeModal("confirmation-dialog");
            if (options.onBulkDeleteSuccess) {
              options.onBulkDeleteSuccess(selectedMedia);
            }
          } catch (error: unknown) {
            const message = getRTKQueryErrorMessage(
              error,
              "Failed to delete images. Please try again."
            );
            toast.error(message);
            // Re-open modal without loading state so user can try again
            openModal("confirmation-dialog", {
              title: "Delete images",
              message: `Are you sure you want to delete these ${count} ${itemText}? This action cannot be undone.`,
              type: "danger",
              isLoading: false,
              onConfirm: () => handleBulkDelete(itemsToDelete),
              onCancel: () => closeModal("confirmation-dialog"),
            });
          }
        },
        onCancel: () => closeModal("confirmation-dialog"),
      });
    },
    [selectedMedia, deleteMedia, openModal, closeModal, options]
  );

  /**
   * Toggle selection of a media item
   */
  const toggleSelection = useCallback((id: string) => {
    setSelectedMedia((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedMedia([]);
  }, []);

  /**
   * Select all items
   */
  const selectAll = useCallback((ids: string[]) => {
    setSelectedMedia(ids);
  }, []);

  return {
    // State
    isUploading,
    isDeleting,
    selectedMedia,

    // Actions
    processFiles,
    handleDelete,
    handleBulkDelete,
    toggleSelection,
    clearSelection,
    selectAll,
    setSelectedMedia,
  };
}
