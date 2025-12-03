import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";

// Helper function to process items in batches
const processInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<Array<PromiseSettledResult<R>>> => {
  const results: Array<PromiseSettledResult<R>> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);
  }

  return results;
};

// Helper function to strip "cmho-temp_" prefix from display name
const getDisplayName = (name?: string): string => {
  if (!name) return "Untitled";
  if (name.startsWith("cmho-temp_")) {
    return name.substring("cmho-temp_".length);
  }
  return name;
};

// Detect if browser is Safari (which has native HEIC support)
const isSafari = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafariUA =
    /safari/.test(userAgent) &&
    !/chrome/.test(userAgent) &&
    !/chromium/.test(userAgent);
  const isSafariVendor = /^((?!chrome|android).)*safari/i.test(
    navigator.userAgent
  );
  return isSafariUA || isSafariVendor;
};

// Try to use browser's native HEIC support (Safari 17+)
const tryNativeHeicConversion = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context not available"));
          return;
        }

        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Convert to JPEG blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error("Failed to convert HEIC to blob"));
              return;
            }

            const convertedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".jpg"),
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            );

            console.log(
              `[HEIC Native Conversion] ${file.name} → ${convertedFile.name}`,
              {
                originalSize: `${(file.size / 1024).toFixed(2)} KB`,
                convertedSize: `${(convertedFile.size / 1024).toFixed(2)} KB`,
                dimensions: `${img.width}x${img.height}`,
              }
            );

            resolve(convertedFile);
          },
          "image/jpeg",
          0.95 // High quality for initial conversion
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Browser cannot decode HEIC file natively"));
    };

    // Try to load the HEIC file as an image
    // Some browsers (Safari) can decode HEIC natively
    img.src = url;
  });
};

// Helper function to convert HEIC to WebP
// Safari: Uses native conversion (faster, no library needed)
// Other browsers: Returns original file - Cloudinary will handle conversion
const convertHeicToWebP = async (file: File): Promise<File> => {
  // Safari has native HEIC support - use it directly for better performance
  if (isSafari()) {
    console.log(
      `[HEIC Conversion] Safari detected, using native conversion for ${file.name}`
    );
    try {
      const jpegFile = await tryNativeHeicConversion(file);
      // Convert the JPEG to WebP
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(jpegFile);

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error("Canvas context not available"));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
              (webpBlob) => {
                URL.revokeObjectURL(url);
                if (!webpBlob) {
                  reject(new Error("Failed to convert to WebP"));
                  return;
                }

                const webpFile = new File(
                  [webpBlob],
                  file.name.replace(/\.[^/.]+$/, ".webp"),
                  {
                    type: "image/webp",
                    lastModified: Date.now(),
                  }
                );

                console.log(
                  `[HEIC Conversion] ${file.name} → ${webpFile.name} (Safari native)`,
                  {
                    originalSize: `${(file.size / 1024).toFixed(2)} KB`,
                    convertedSize: `${(webpFile.size / 1024).toFixed(2)} KB`,
                    dimensions: `${img.width}x${img.height}`,
                  }
                );

                resolve(webpFile);
              },
              "image/webp",
              0.95
            );
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load JPEG for WebP conversion"));
        };

        img.src = url;
      });
    } catch (error) {
      console.error(
        `[HEIC Conversion] Safari native conversion failed for ${file.name}:`,
        error
      );
      throw error;
    }
  }

  // Non-Safari browsers: Return original file - Cloudinary will handle conversion
  console.log(
    `[HEIC Conversion] Non-Safari browser detected for ${file.name}, will upload original HEIC to Cloudinary for conversion`
  );
  return file;
};

// Helper function to optimize image if needed
const optimizeImage = async (file: File): Promise<File> => {
  const sizeThreshold = 100 * 1024; // 100KB
  const dimensionThreshold = 1280; // width + height sum
  const maxSize = 10 * 1024 * 1024; // 10MB

  // Early rejection: files > 10MB should have been caught in validation, but double-check
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File "${file.name}" is ${fileSizeMB}MB and exceeds the 10MB limit`
    );
  }

  // Check if file is HEIC/HEIF and convert it first
  const isHeic =
    file.type.toLowerCase() === "image/heic" ||
    file.type.toLowerCase() === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  let workingFile = file;
  if (isHeic) {
    try {
      workingFile = await convertHeicToWebP(file);
    } catch (error: unknown) {
      // If HEIC conversion fails but file is < 10MB, allow it to pass through
      // Cloudinary will handle the conversion and optimization
      const errorObj = error as { code?: number; message?: string };
      const errorMessage = errorObj.message || "HEIC conversion failed";

      const maxSizeForPassthrough = 10 * 1024 * 1024; // 10MB
      if (file.size <= maxSizeForPassthrough) {
        console.warn(
          `[Image Optimization] ${file.name}: ${errorMessage} - file will be uploaded to server for Cloudinary processing`
        );
        // Return original file - Cloudinary will handle conversion and optimization
        return file;
      }

      console.warn(
        `[Image Optimization] ${file.name}: ${errorMessage} - file exceeds 10MB and will be rejected`
      );

      // Throw error to reject the file
      throw new Error(errorMessage);
    }
  }

  // Store original file details for logging
  const originalSize = file.size;
  const originalSizeKB = (originalSize / 1024).toFixed(2);

  // If file is smaller than threshold, check dimensions
  if (workingFile.size <= sizeThreshold) {
    // Check dimensions by loading image
    const needsOptimization = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(workingFile);
      img.onload = () => {
        const dimensionSum = img.width + img.height;
        URL.revokeObjectURL(url);
        resolve(dimensionSum > dimensionThreshold);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false); // If can't load, don't optimize
      };
      img.src = url;
    });

    if (!needsOptimization) {
      return workingFile; // No optimization needed
    }
  }

  // Optimization needed - resize and compress
  return new Promise<File>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(workingFile);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(file); // Fallback to original
          return;
        }

        // Store original dimensions for logging
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Calculate new dimensions
        let { width, height } = img;
        const dimensionSum = width + height;
        const wasInitiallyShrunk = dimensionSum > dimensionThreshold;

        if (wasInitiallyShrunk) {
          // Scale down proportionally to meet dimension threshold
          const scale = dimensionThreshold / dimensionSum;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              URL.revokeObjectURL(url);
              resolve(file); // Fallback to original if conversion fails
              return;
            }

            // Create new file with optimized blob
            let optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"), // Change extension to .webp
              {
                type: "image/webp",
                lastModified: Date.now(),
              }
            );

            const sizeThresholdKB = 300; // 300KB
            const optimizedSizeKB = optimizedFile.size / 1024;

            // If dimensions weren't initially shrunk AND file is still > 300KB, shrink by 25%
            if (!wasInitiallyShrunk && optimizedSizeKB > sizeThresholdKB) {
              // Shrink dimensions by 25%
              const shrunkWidth = Math.round(width * 0.75);
              const shrunkHeight = Math.round(height * 0.75);

              // Create new canvas with shrunk dimensions
              const shrunkCanvas = document.createElement("canvas");
              const shrunkCtx = shrunkCanvas.getContext("2d");
              if (shrunkCtx) {
                shrunkCanvas.width = shrunkWidth;
                shrunkCanvas.height = shrunkHeight;
                shrunkCtx.drawImage(img, 0, 0, shrunkWidth, shrunkHeight);

                // Convert to blob again
                shrunkCanvas.toBlob(
                  (shrunkBlob) => {
                    if (shrunkBlob) {
                      optimizedFile = new File(
                        [shrunkBlob],
                        file.name.replace(/\.[^/.]+$/, ".webp"),
                        {
                          type: "image/webp",
                          lastModified: Date.now(),
                        }
                      );

                      // Log optimization details with second pass
                      const finalSizeKB = (optimizedFile.size / 1024).toFixed(
                        2
                      );
                      const sizeReduction = (
                        ((originalSize - optimizedFile.size) / originalSize) *
                        100
                      ).toFixed(1);

                      console.log(`[Image Optimization] ${file.name}`, {
                        before: {
                          size: `${originalSizeKB} KB`,
                          dimensions: `${originalWidth}x${originalHeight}`,
                          dimensionSum: originalWidth + originalHeight,
                        },
                        after: {
                          size: `${finalSizeKB} KB`,
                          dimensions: `${shrunkWidth}x${shrunkHeight}`,
                          dimensionSum: shrunkWidth + shrunkHeight,
                        },
                        reduction: `${sizeReduction}%`,
                        used:
                          optimizedFile.size < file.size
                            ? "optimized"
                            : "original",
                        note: "Dimensions shrunk by 25% (second pass)",
                      });

                      URL.revokeObjectURL(url);
                      resolve(
                        optimizedFile.size < file.size ? optimizedFile : file
                      );
                    } else {
                      // Fallback to first optimization result
                      URL.revokeObjectURL(url);
                      resolve(
                        optimizedFile.size < file.size ? optimizedFile : file
                      );
                    }
                  },
                  "image/webp",
                  0.85
                );
              } else {
                // Fallback to first optimization result
                URL.revokeObjectURL(url);
                resolve(optimizedFile.size < file.size ? optimizedFile : file);
              }
            } else {
              // Log optimization details (first pass only or already small enough)
              const finalSizeKB = (optimizedFile.size / 1024).toFixed(2);
              const sizeReduction = (
                ((originalSize - optimizedFile.size) / originalSize) *
                100
              ).toFixed(1);

              console.log(`[Image Optimization] ${file.name}`, {
                before: {
                  size: `${originalSizeKB} KB`,
                  dimensions: `${originalWidth}x${originalHeight}`,
                  dimensionSum: originalWidth + originalHeight,
                },
                after: {
                  size: `${finalSizeKB} KB`,
                  dimensions: `${width}x${height}`,
                  dimensionSum: width + height,
                },
                reduction: `${sizeReduction}%`,
                used: optimizedFile.size < file.size ? "optimized" : "original",
              });

              URL.revokeObjectURL(url);
              // Use optimized file if it's actually smaller, otherwise use original
              resolve(optimizedFile.size < file.size ? optimizedFile : file);
            }
          },
          "image/webp",
          0.85 // Quality: 0.85 (85%)
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        resolve(file); // Fallback to original on error
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original if image can't load
    };

    img.src = url;
  });
};
import {
  Search,
  Trash2,
  List,
  Grid3x3,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckSquare,
  ZoomIn,
  MousePointer2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetGalleryQuery,
  useUploadGalleryMutation,
  useDeleteGalleryMutation,
  IGalleryDto,
} from "@/store/gallery-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useModalContext } from "@/contexts/modal-context";

function MediaItem({
  galleryItem,
  isSelected,
  viewMode,
  onSelect,
  showCheckbox,
  onZoomClick,
}: {
  galleryItem: IGalleryDto;
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: (checked: boolean) => void;
  showCheckbox: boolean;
  onZoomClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  // Use imageUrl if available, otherwise fall back to populated media
  const media =
    typeof galleryItem.media_id === "object" ? galleryItem.media_id : null;
  const mediaUrl = galleryItem.imageUrl || media?.url || "";
  const displayName = getDisplayName(galleryItem.name || media?.filename);
  const mediaType = media?.type || "";

  const isImage =
    (mediaType?.toLowerCase().includes("image") ||
      mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) &&
    !imageError;

  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden border transition-all",
        viewMode === "grid" ? "aspect-square" : "flex items-center gap-3 p-2",
        isSelected && "ring-1 ring-primary border-primary",
        showCheckbox && "cursor-pointer"
      )}
      onClick={() => {
        if (showCheckbox) {
          onSelect(!isSelected);
        }
      }}
    >
      {/* Selection Indicator */}
      {showCheckbox && (
        <div
          className="absolute top-2 left-2 z-10 flex"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(!isSelected);
          }}
        >
          <div
            className={cn(
              "h-8 w-8 sm:h-7 sm:w-7 rounded-md bg-white/20 backdrop-blur-md border-2 border-white/80 flex items-center justify-center transition-all",
              isSelected && "bg-white/40"
            )}
          >
            {isSelected && (
              <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-black" />
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
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Filename */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate flex items-center justify-between gap-2",
          viewMode === "list" &&
            "static bg-transparent text-foreground flex-1 min-w-0"
        )}
      >
        <span className="truncate flex-1">{displayName}</span>
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
      </div>
    </div>
  );
}

type ViewMode = "grid" | "list";

export function GallerySection({
  onProcessFilesReady,
}: {
  onProcessFilesReady?: (
    processFiles: (files: File[]) => Promise<void>
  ) => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetGalleryQuery({
    page,
    limit: 100,
  });
  const [uploadGallery] = useUploadGalleryMutation();
  const [deleteGallery, { isLoading: isDeleting }] = useDeleteGalleryMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideshowImageRef = useRef<HTMLImageElement>(null);
  const { openModal, closeModal } = useModalContext();

  const galleryList = data?.data?.items || [];
  const hasNextPage = data?.data?.meta?.hasNextPage ?? false;

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return galleryList;
    const query = searchQuery.toLowerCase();
    return galleryList.filter((item) => {
      const media = typeof item.media_id === "object" ? item.media_id : null;
      const storedName = item.name || media?.filename || "";
      const displayName = getDisplayName(storedName);
      const url = media?.url || "";
      // Search both stored name (with prefix) and display name (without prefix)
      return (
        storedName.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query) ||
        url.toLowerCase().includes(query)
      );
    });
  }, [galleryList, searchQuery]);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Validate file types and sizes
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/png",
        "image/heic",
      ];
      const allowedExtensions = [".jpeg", ".jpg", ".webp", ".png", ".heic"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      // Separate validation: first check file types, then check sizes
      const invalidTypeFiles = files.filter((file) => {
        const fileExtension = file.name
          .toLowerCase()
          .substring(file.name.lastIndexOf("."));
        const isValidType =
          allowedTypes.includes(file.type.toLowerCase()) ||
          allowedExtensions.includes(fileExtension);
        return !isValidType;
      });

      const oversizedFiles = files.filter((file) => file.size > maxSize);

      // Show validation errors in failed uploads modal
      if (invalidTypeFiles.length > 0 || oversizedFiles.length > 0) {
        const validationFailedFiles: Array<{
          file: File;
          preview: string;
          error: string;
        }> = [];

        // Add invalid type files
        invalidTypeFiles.forEach((file) => {
          const preview = URL.createObjectURL(file);
          validationFailedFiles.push({
            file,
            preview,
            error:
              "Unsupported format. Only JPEG, JPG, PNG, WEBP, and HEIC files are allowed.",
          });
        });

        // Add oversized files
        oversizedFiles.forEach((file) => {
          const preview = URL.createObjectURL(file);
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          validationFailedFiles.push({
            file,
            preview,
            error: `File size is ${fileSizeMB}MB and exceeds the 10MB limit.`,
          });
        });

        // Show toast with action to view failed files
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
              // Clean up preview URLs if toast is dismissed without opening modal
              validationFailedFiles.forEach((item) => {
                URL.revokeObjectURL(item.preview);
              });
            },
          }
        );

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const fileCount = files.length;
      const fileText = fileCount === 1 ? "image" : "images";

      // Show loading toast
      const toastId = toast.loading(`Uploading ${fileCount} ${fileText}...`, {
        duration: Infinity, // Keep it open until we update it
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
        const optimizationFailedFiles: Array<{
          file: File;
          preview: string;
          error: string;
        }> = [];

        optimizationResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            optimizedFiles.push(result.value);
          } else {
            // Optimization failed (e.g., HEIC conversion failed)
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
            return uploadGallery({ formData }).unwrap();
          }
        );

        // Collect failed uploads with file objects and preview URLs
        const uploadFailedFiles: Array<{
          file: File;
          preview: string;
          error: string;
        }> = [];
        let successCount = 0;

        uploadResults.forEach((result, index) => {
          if (result.status === "rejected") {
            const file = optimizedFiles[index];
            const preview = URL.createObjectURL(file);
            const errorMessage =
              getRTKQueryErrorMessage(result.reason) || "Upload failed";
            uploadFailedFiles.push({ file, preview, error: errorMessage });
          } else {
            successCount++;
          }
        });

        // Combine optimization failures and upload failures
        const failedFiles: Array<{
          file: File;
          preview: string;
          error: string;
        }> = [...optimizationFailedFiles, ...uploadFailedFiles];

        // Show appropriate message based on results
        if (failedFiles.length === 0) {
          // All succeeded
          toast.success(`${fileCount} ${fileText} uploaded successfully`, {
            id: toastId,
            duration: 5000,
          });
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
                // Clean up preview URLs if toast is dismissed without opening modal
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
                // Clean up preview URLs if toast is dismissed without opening modal
                failedFiles.forEach((item) => {
                  URL.revokeObjectURL(item.preview);
                });
              },
            }
          );
        }

        // Only reset page if at least one file succeeded
        if (successCount > 0) {
          setPage(1); // Reset to first page to see new uploads
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error: unknown) {
        // This catch should rarely be hit now since we use allSettled
        const message =
          getRTKQueryErrorMessage(error) ||
          "Failed to upload files. Please try again.";
        toast.error(message, { id: toastId, duration: Infinity });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } finally {
        setIsUploading(false);
      }
    },
    [uploadGallery, openModal, setPage]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const handleDelete = (galleryItem: IGalleryDto) => {
    const media =
      typeof galleryItem.media_id === "object" ? galleryItem.media_id : null;
    const displayName = getDisplayName(
      galleryItem.name || media?.filename || "this image"
    );

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
          onConfirm: async () => {}, // Prevent multiple clicks
          onCancel: () => {}, // Disable cancel during loading
        });

        try {
          await deleteGallery(galleryItem._id).unwrap();
          toast.success("Image deleted successfully", {
            duration: 3000,
          });
          setSelectedMedia((prev) =>
            prev.filter((id) => id !== galleryItem._id)
          );
          closeModal("confirmation-dialog");
        } catch (error: unknown) {
          const message =
            getRTKQueryErrorMessage(error) ||
            "Failed to delete image. Please try again.";
          toast.error(message);
          // Re-open modal without loading state so user can try again
          openModal("confirmation-dialog", {
            title: "Delete image",
            message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
            type: "danger",
            isLoading: false,
            onConfirm: async () => {
              handleDelete(galleryItem);
            },
            onCancel: () => closeModal("confirmation-dialog"),
          });
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  const handleDeleteSelected = () => {
    if (selectedMedia.length === 0) return;

    const count = selectedMedia.length;
    const itemText = count === 1 ? "image" : "images";
    const itemsToDelete = galleryList.filter((item) =>
      selectedMedia.includes(item._id)
    );

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
          onConfirm: async () => {}, // Prevent multiple clicks
          onCancel: () => {}, // Disable cancel during loading
        });

        try {
          await Promise.all(
            itemsToDelete.map((item) => deleteGallery(item._id).unwrap())
          );
          toast.success(`${count} ${itemText} deleted successfully`, {
            duration: 3000,
          });
          setSelectedMedia([]);
          closeModal("confirmation-dialog");
        } catch (error: unknown) {
          const message =
            getRTKQueryErrorMessage(error) ||
            "Failed to delete images. Please try again.";
          toast.error(message);
          // Re-open modal without loading state so user can try again
          openModal("confirmation-dialog", {
            title: "Delete images",
            message: `Are you sure you want to delete these ${count} ${itemText}? This action cannot be undone.`,
            type: "danger",
            isLoading: false,
            onConfirm: async () => {
              handleDeleteSelected();
            },
            onCancel: () => closeModal("confirmation-dialog"),
          });
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Expose processFiles function to parent component
  useEffect(() => {
    if (onProcessFilesReady) {
      onProcessFilesReady(processFiles);
    }
  }, [onProcessFilesReady, processFiles]);

  // Handle Escape key to deselect all or close slideshow
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
  }, [selectedMedia.length, slideshowIndex]);

  // Handle keyboard navigation in slideshow
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

  // Reset loading state when slideshow index changes
  useEffect(() => {
    if (slideshowIndex !== null) {
      setIsImageLoading(true);
      // Check if image is already cached/loaded after a brief delay
      // This allows the img element to render and check its complete property
      const timer = setTimeout(() => {
        if (slideshowImageRef.current?.complete) {
          setIsImageLoading(false);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [slideshowIndex]);

  // Infinite scroll handler - use window scroll
  useEffect(() => {
    if (!hasNextPage || isFetching) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      // Load more when user is within 300px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 300) {
        setPage((prev) => {
          // Prevent loading if already at max or currently fetching
          if (prev >= (data?.data?.meta?.totalPages ?? 1)) return prev;
          return prev + 1;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetching, data?.data?.meta?.totalPages]);

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
        {/* Search Bar */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setShowCheckboxes(!showCheckboxes);
              if (!showCheckboxes) {
                // When hiding checkboxes, clear selection
                setSelectedMedia([]);
              }
            }}
            title={showCheckboxes ? "Exit select mode" : "Select items"}
            // className={"text-primary-foreground"}
          >
            {showCheckboxes ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <MousePointer2 className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload File
          </Button>
          {showCheckboxes && selectedMedia.length > 0 && (
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpeg,.jpg,.png,.webp,.heic,image/jpeg,image/jpg,image/png,image/webp,image/heic"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Media Grid/List */}
      <div>
        {filteredMedia.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery ? "No media found" : "No media uploaded yet"}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" onClick={handleUploadClick}>
                Upload your first file
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "flex flex-col gap-2"
            )}
          >
            {filteredMedia.map((galleryItem, index) => (
              <MediaItem
                key={galleryItem._id}
                galleryItem={galleryItem}
                isSelected={selectedMedia.includes(galleryItem._id)}
                viewMode={viewMode}
                showCheckbox={showCheckboxes}
                onSelect={(checked) => {
                  setSelectedMedia((prev) =>
                    checked
                      ? [...prev, galleryItem._id]
                      : prev.filter((id) => id !== galleryItem._id)
                  );
                }}
                onZoomClick={() => setSlideshowIndex(index)}
              />
            ))}
            {isFetching && (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading more...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Slideshow Overlay */}
      {slideshowIndex !== null && filteredMedia[slideshowIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Glassmorphic Backdrop */}
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

                    {/* Image - Hidden until loaded */}
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
                    {/* Image Info - Only show when image is loaded */}
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
