import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

cloudinary.config(env.CLOUDINARY_CONFIG);

export const uploadToCloud = async function (filepath: string) {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      folder: `${env.CLOUDINARY_FOLDER}/images`,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"],
      use_filename: true,
      format: "webp",
      // Transformations: resize if width + height > 1280, optimize quality
      // Using limit mode with 640x640 ensures width + height <= 1280 for square images
      // For other aspect ratios, it will scale proportionally to fit within 640x640
      transformation: [
        {
          // Limit dimensions to ensure width + height <= 1280
          // For square: 640x640 = 1280 total
          // For landscape/tall: will scale proportionally
          width: 640,
          height: 640,
          crop: "limit", // Maintains aspect ratio, only resizes if exceeds dimensions
          quality: "auto:good", // Auto quality optimization for size reduction
          fetch_format: "webp", // Convert to WebP
        },
      ],
      // Eager transformations to generate optimized versions immediately
      eager: [
        {
          width: 640,
          height: 640,
          crop: "limit",
          quality: "auto:good",
          fetch_format: "webp",
        },
      ],
    });

    // Use the eager transformation URL if available (optimized version)
    // Otherwise fall back to secure_url (which will have transformations applied on-the-fly)
    const optimizedUrl = result.eager?.[0]?.secure_url || result.secure_url;

    return {
      url: optimizedUrl,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      filename:
        result.original_filename || result.public_id.split("/").pop() || "",
      duration: undefined,
    };
  } catch (error: unknown) {
    let errorMessage = "Error uploading file";
    if (error instanceof Error) errorMessage = error.message;
    else errorMessage = String(error);

    throw new Error(errorMessage);
  }
};

export async function uploadFileByUrl(imageUrl: string) {
  const publicId = imageUrl.split("/image/upload/")[1].replace(/[\w_-]*\//, "");
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `rollover`,
      use_filename: true,
      format: "webp",
      // public_id: publicId, // Set the public_id to the desired name
      overwrite: true, // Allow overwriting if a file with the same name exists
    });

    console.log(`File uploaded: ${result.secure_url}`);
    return result;
  } catch (error: unknown) {
    let errorMessage = "Error uploading file";
    if (error instanceof Error) errorMessage = error.message;
    else errorMessage = String(error);

    throw new Error(errorMessage);
  }
}

export const uploadVideoToCloud = async function (filepath: string) {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      folder: `${env.CLOUDINARY_FOLDER}/videos`,
      allowed_formats: ["mp4", "webm"],
      resource_type: "video",
      format: "webm",
      use_filename: true,
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      filename:
        result.original_filename || result.public_id.split("/").pop() || "",
      duration: result.duration,
    };
  } catch (error: unknown) {
    let errorMessage = "Error uploading file";
    if (error instanceof Error) errorMessage = error.message;
    else errorMessage = String(error);

    throw new Error(errorMessage);
  }
};

export const uploadDocToCloud = async function (filepath: string) {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      folder: env.CLOUDINARY_FOLDER,
      allowed_formats: ["pdf", "doc", "docx"],
      resource_type: "raw",
      use_filename: true,
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format || "raw",
      filename:
        result.original_filename || result.public_id.split("/").pop() || "",
      duration: undefined,
    };
  } catch (error: unknown) {
    let errorMessage = "Error uploading file";
    if (error instanceof Error) errorMessage = error.message;
    else errorMessage = String(error);

    throw new Error(errorMessage);
  }
};

export const getImageThumbnail = function (uploadResult: any) {
  return cloudinary.url(uploadResult.public_id, {
    width: 320,
    height: 320,
    crop: "fill",
  });
};

export const deleteFromCloud = function (publicID: string) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicID, function (result: any) {
      resolve(result);
    });
  });
};

export const multipleUpload = async function (
  filepaths: string[] = [],
  concurrencyLimit: number = 10
) {
  const results: Array<
    { url: string; public_id: string } | { error: unknown }
  > = [];

  // Process uploads in batches to respect Cloudinary's concurrency limits
  for (let i = 0; i < filepaths.length; i += concurrencyLimit) {
    const batch = filepaths.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(
      batch.map((filepath) => uploadToCloud(filepath))
    );

    results.push(
      ...batchResults.map((result) =>
        result.status === "fulfilled" ? result.value : { error: result.reason }
      )
    );
  }

  return results;
};
