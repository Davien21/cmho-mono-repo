/**
 * Reusable image processing utilities for upload, conversion, and optimization
 */

// Detect if browser is Safari (which has native HEIC support)
export function isSafari(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafariUA =
    /safari/.test(userAgent) &&
    !/chrome/.test(userAgent) &&
    !/chromium/.test(userAgent);
  const isSafariVendor = /^((?!chrome|android).)*safari/i.test(
    navigator.userAgent
  );
  return isSafariUA || isSafariVendor;
}

// Try to use browser's native HEIC support (Safari 17+)
async function tryNativeHeicConversion(file: File): Promise<File> {
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
}

/**
 * Convert HEIC/HEIF files to WebP format
 * Safari: Uses native conversion (faster, no library needed)
 * Other browsers: Returns original file - Cloudinary will handle conversion
 */
export async function convertHeicToWebP(file: File): Promise<File> {
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
}

export interface ImageOptimizationOptions {
  sizeThreshold?: number; // in bytes, default: 100KB
  dimensionThreshold?: number; // sum of width + height, default: 1280
  maxSize?: number; // in bytes, default: 10MB
  quality?: number; // 0-1, default: 0.85
  targetSizeKB?: number; // target size after first pass, default: 300KB
}

/**
 * Optimize image by converting to WebP and resizing if needed
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    sizeThreshold = 100 * 1024, // 100KB
    dimensionThreshold = 1280,
    maxSize = 10 * 1024 * 1024, // 10MB
    quality = 0.85,
    targetSizeKB = 300,
  } = options;

  // Early rejection: files > 10MB should have been caught in validation, but double-check
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File "${file.name}" is ${fileSizeMB}MB and exceeds the ${
        maxSize / (1024 * 1024)
      }MB limit`
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
      // If it's a HEIC file that was converted, we still want the new extension
      if (workingFile !== file) {
        return workingFile;
      }

      // For original files, if they are HEIC, ensure we change extension even if no optimization was needed
      if (isHeic) {
        return new File([file], file.name.replace(/\.(heic|heif)$/i, ".webp"), {
          type: "image/webp",
          lastModified: file.lastModified,
        });
      }

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

            const optimizedSizeKB = optimizedFile.size / 1024;

            // If dimensions weren't initially shrunk AND file is still > targetSizeKB, shrink by 25%
            if (!wasInitiallyShrunk && optimizedSizeKB > targetSizeKB) {
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
                  quality
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
          quality
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
}

/**
 * Process items in batches with concurrency control
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Convert file to base64 string (useful for API calls)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

