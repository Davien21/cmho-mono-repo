import { Request, Response } from "express";
import { uploadToCloudHighQuality } from "../../lib/cloudinary";
import { successResponse } from "../../utils/response";
import mediaService from "./media.service";
import { getMediaType, uploadFncs } from "../../utils/helpers";
import * as fs from "fs/promises";
import { BadRequestError } from "../../config/errors";
import { geminiService } from "../../services/gemini.service";
import { MediaCategory } from "./media.types";
import inventoryBalancesService from "../inventory-balances/inventory-balances.service";

class MediaController {
  async getAll(req: Request, res: Response) {
    const category = req.query.category as MediaCategory;
    const media = await mediaService.findAll(category);
    res.send(successResponse("Successfully retrieved media", media));
  }

  async create(req: Request, res: Response) {
    const { file } = req;
    const { category } = req.body;

    if (!file) throw new BadRequestError("File is required");

    const fileType = getMediaType(file.mimetype);

    // Use high-quality upload for balance sheets, regular upload for others
    const isBalanceSheet = category === MediaCategory.BALANCE_SHEET;
    const uploader =
      isBalanceSheet && fileType === "image"
        ? uploadToCloudHighQuality
        : uploadFncs[fileType];

    const upload = await uploader(file.path);

    const media = await mediaService.create({
      filename: upload.filename || file.originalname,
      public_id: upload.public_id,
      size: upload.bytes,
      type: upload.format,
      url: upload.url,
      category: category || MediaCategory.INVENTORY,
      duration: upload.duration || null,
    });

    await fs.unlink(file.path);

    res.send(successResponse("Successfully saved media", media));
  }

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
