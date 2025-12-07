import { Request, Response } from "express";
import galleryService from "./gallery.service";
import mediaService from "../media/media.service";
import { successResponse } from "../../utils/response";
import { GalleryRequest } from "./gallery.types";
import { getMediaType, uploadFncs } from "../../utils/helpers";
import { deleteFromCloud } from "../../lib/cloudinary";
import * as fs from "fs/promises";
import { BadRequestError, NotFoundError } from "../../config/errors";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-types";
import { getAdminFromReq } from "../../utils/request-helpers";

export async function getGalleryItems(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;

  const result = await galleryService.list({ page, limit });
  res.send(successResponse("Gallery items fetched successfully", result));
}

export async function getGalleryItem(req: Request, res: Response) {
  const { id } = req.params;
  const item = await galleryService.findById(id);
  if (!item) {
    throw new NotFoundError("Gallery item not found");
  }
  res.send(successResponse("Gallery item fetched successfully", item));
}

export async function createGalleryItem(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { file } = req;
  const { name } = req.body;

  if (!file) {
    throw new BadRequestError("File is required");
  }

  // Upload file using media service logic
  const fileType = getMediaType(file.mimetype);
  const uploader = uploadFncs[fileType];
  const upload = await uploader(file.path);

  // Create media document using media service
  const media = await mediaService.create({
    filename: upload.filename || file.originalname,
    public_id: upload.public_id,
    size: upload.bytes,
    type: upload.format,
    url: upload.url,
    duration: upload.duration || null,
  });

  // Clean up uploaded file
  await fs.unlink(file.path);

  // If no name provided, use filename with "cmho-temp_" prefix
  const galleryName = name?.trim() || `cmho-temp_${file.originalname}`;

  // Create gallery document with media_id reference
  const galleryItem = await galleryService.create({
    media_id: media._id.toString(),
    name: galleryName,
    imageUrl: upload.url,
  });

  // Track the activity
  const activityData = {
    type: ActivityTypes.CREATE_GALLERY_ITEM,
    module: "inventory",
    entities: [
      { id: galleryItem._id.toString(), name: "gallery-item" },
      { id: media._id.toString(), name: "media" },
    ],
    adminId: admin._id,
    adminName: admin.name,
    description: `Added image "${galleryName}" to gallery`,
    metadata: {
      imageUrl: upload.url,
      filename: upload.filename,
      public_id: upload.public_id,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Gallery item created successfully", galleryItem));
}

export async function updateGalleryItem(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;
  const data = req.body as Partial<GalleryRequest>;

  const galleryItem = await galleryService.update(id, data);

  if (!galleryItem) {
    throw new NotFoundError("Gallery item not found");
  }

  // Track the activity
  const galleryName = galleryItem.name || "Unknown Gallery Item";
  const changedFields = Object.keys(data);
  const activityData = {
    type: ActivityTypes.UPDATE_GALLERY_ITEM,
    module: "inventory",
    entities: [{ id: id, name: "gallery-item" }],
    adminId: admin._id,
    adminName: admin.name,
    description:
      changedFields.length === 1
        ? `Updated ${changedFields[0]} for gallery item "${galleryName}"`
        : `Updated gallery item "${galleryName}"`,
    metadata: {
      changedFields,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Gallery item updated successfully", galleryItem));
}

export async function deleteGalleryItem(req: Request, res: Response) {
  const { id } = req.params;

  // Find the gallery item first to get the media_id (without population to get the raw ObjectId)
  const galleryItemRaw = await galleryService.findById(id);
  if (!galleryItemRaw) {
    throw new NotFoundError("Gallery item not found");
  }

  // Get media_id - it might be populated (object) or just the ID
  const mediaId =
    typeof galleryItemRaw.media_id === "object" &&
    galleryItemRaw.media_id !== null
      ? (galleryItemRaw.media_id as any)._id?.toString() ||
        (galleryItemRaw.media_id as any).toString()
      : String(galleryItemRaw.media_id);

  // Fetch the media document to get public_id
  const media = await mediaService.findById(mediaId);
  if (media && media.public_id) {
    try {
      await deleteFromCloud(media.public_id);
    } catch (error) {
      // Log error but continue with deletion - Cloudinary deletion failure shouldn't block DB deletion
      console.error("Error deleting from cloudinary:", error);
    }
  }

  // Delete the media document
  if (media) {
    await mediaService.delete(media._id.toString());
  }

  // Delete the gallery document (soft delete)
  await galleryService.delete(id);

  // Track the activity
  // Use galleryItemRaw that was already fetched before deletion
  if (galleryItemRaw) {
    const admin = getAdminFromReq(req);
    const galleryName = galleryItemRaw.name || "Unknown Gallery Item";
    const activityData = {
      type: ActivityTypes.DELETE_GALLERY_ITEM,
      module: "inventory",
      entities: [
        { id: id, name: "gallery-item" },
        { id: mediaId, name: "media" },
      ],
      adminId: admin._id,
      adminName: admin.name,
      description: `Deleted gallery item "${galleryName}"`,
      metadata: {
        public_id: media?.public_id,
      },
    };
    await activityTrackingService.trackActivity(activityData);
  }

  res.send(successResponse("Gallery item deleted successfully"));
}
