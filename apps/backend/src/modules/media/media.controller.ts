import { Request, Response } from "express";
import {
  uploadForStockBalanceProcessing,
  deleteFromCloud,
} from "../../lib/cloudinary";
import { successResponse } from "../../utils/response";
import mediaService from "./media.service";
import { getMediaType, uploadFncs } from "../../utils/helpers";
import * as fs from "fs/promises";
import { BadRequestError, NotFoundError } from "../../config/errors";
import { geminiService } from "../../services/gemini.service";
import { MediaCategory } from "./media.types";
import inventoryBalancesService from "../inventory-balances/inventory-balances.service";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-tracking.types";
import { getAdminFromReq } from "../../utils/request-helpers";

class MediaController {
  /**
   * Get paginated list of media (replaces Gallery getAll)
   */
  async getAll(req: Request, res: Response) {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "100");
    const category = req.query.category as MediaCategory;

    const result = await mediaService.list({ page, limit, category });
    res.send(successResponse("Media items fetched successfully", result));
  }

  /**
   * Get single media item
   */
  async getOne(req: Request, res: Response) {
    const { id } = req.params;
    const media = await mediaService.findById(id);

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    res.send(successResponse("Media fetched successfully", media));
  }

  /**
   * Create media with activity tracking
   */
  async create(req: Request, res: Response) {
    const admin = getAdminFromReq(req);
    const { file } = req;
    const { category, name } = req.body;

    if (!file) throw new BadRequestError("File is required");

    const fileType = getMediaType(file.mimetype);

    // Use high-quality upload for balance sheets, regular upload for others
    const isBalanceSheet = category === MediaCategory.BALANCE_SHEET;
    const uploader =
      isBalanceSheet && fileType === "image"
        ? uploadForStockBalanceProcessing
        : uploadFncs[fileType];

    const upload = await uploader(file.path);

    // Generate name using convention: provided name or cmho-temp_[filename]
    const mediaName =
      name && name.trim()
        ? name.trim()
        : `cmho-temp_${upload.filename || file.originalname}`;

    const media = await mediaService.create({
      filename: upload.filename || file.originalname,
      public_id: upload.public_id,
      size: upload.bytes,
      type: upload.format,
      url: upload.url,
      category: category || MediaCategory.INVENTORY,
      duration: upload.duration || null,
      name: mediaName,
    });

    await fs.unlink(file.path);

    // Track activity
    await activityTrackingService.trackActivity({
      type: ActivityTypes.CREATE_MEDIA_ITEM,
      module: "inventory",
      entities: [{ id: media._id, name: "media" }],
      performerId: admin._id,
      performerName: admin.name,
      description: `Added media "${media.name}"`,
      metadata: {
        url: media.url,
        filename: media.filename,
        public_id: media.public_id,
        category: media.category,
      },
    });

    res.send(successResponse("Successfully saved media", media));
  }

  /**
   * Update media metadata
   */
  async update(req: Request, res: Response) {
    const admin = getAdminFromReq(req);
    const { id } = req.params;
    const { name, category } = req.body;

    const media = await mediaService.update(id, { name, category });

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    // Track activity
    await activityTrackingService.trackActivity({
      type: ActivityTypes.UPDATE_MEDIA_ITEM,
      module: "inventory",
      entities: [{ id: media._id, name: "media" }],
      performerId: admin._id,
      performerName: admin.name,
      description: `Updated media "${media.name}"`,
    });

    res.send(successResponse("Media updated successfully", media));
  }

  /**
   * Delete media by ID (soft delete with activity tracking)
   */
  async deleteById(req: Request, res: Response) {
    const admin = getAdminFromReq(req);
    const { id } = req.params;

    const media = await mediaService.findById(id);
    if (!media) {
      throw new NotFoundError("Media not found");
    }

    // Delete associated AI inventory balance items
    await inventoryBalancesService.deleteByMediaId(id);

    // Soft delete the media
    await mediaService.softDelete(id);

    // Also delete from cloud
    await deleteFromCloud(media.public_id);

    // Track activity
    await activityTrackingService.trackActivity({
      type: ActivityTypes.DELETE_MEDIA_ITEM,
      module: "inventory",
      entities: [{ id: media._id, name: "media" }],
      performerId: admin._id,
      performerName: admin.name,
      description: `Deleted media "${media.name}"`,
    });

    res.send(successResponse("Successfully deleted media"));
  }

  /**
   * Legacy: Delete by public_id (hard delete)
   * Kept for backward compatibility
   */
  async delete(req: Request, res: Response) {
    // First, get the media to find its ID
    const media = await mediaService.findByPublicId(req.body.public_id);

    if (media) {
      // Delete associated AI inventory balance items
      await inventoryBalancesService.deleteByMediaId(media._id.toString());
    }

    // Then delete the media itself
    await mediaService.deleteByPublicId(req.body.public_id);

    res.send(successResponse("Successfully deleted media"));
  }

  /**
   * Legacy: Delete by URL (hard delete)
   * Kept for backward compatibility
   */
  async deleteByUrl(req: Request, res: Response) {
    console.log({ url: req.body.url });

    // First, get the media to find its ID
    const media = await mediaService.findByUrl(req.body.url);

    if (media) {
      // Delete associated AI inventory balance items
      await inventoryBalancesService.deleteByMediaId(media._id.toString());
    }

    // Then delete the media itself
    await mediaService.deleteByUrl(req.body.url);
    res.send(successResponse("Successfully deleted media"));
  }

  async transcribeImage(req: Request, res: Response) {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new BadRequestError("imageUrl is required");
    }

    try {
      const result = await geminiService.transcribeImage(imageUrl);
      res.send(successResponse("Image transcribed successfully", result));
    } catch (error: any) {
      throw error;
    }
  }
}

export default new MediaController();
