import { Request, Response } from "express";
import { deleteFromCloud } from "../../lib/cloudinary";
import { successResponse } from "../../utils/response";
import mediaService from "./media.service";
import { getMediaType, uploadFncs } from "../../utils/helpers";
import * as fs from "fs/promises";
import { BadRequestError } from "../../config/errors";

class MediaController {
  async getAll(_req: Request, res: Response) {
    const media = await mediaService.findAll();
    res.send(successResponse("Successfully retrieved media", media));
  }

  async create(req: Request, res: Response) {
    const { file } = req;
    if (!file) throw new BadRequestError("File is required");

    const fileType = getMediaType(file.mimetype);
    const uploader = uploadFncs[fileType];
    const upload = await uploader(file.path);

    const media = await mediaService.create({
      filename: upload.filename || file.originalname,
      public_id: upload.public_id,
      size: upload.bytes,
      type: upload.format,
      url: upload.url,
      duration: upload.duration || null,
    });

    await fs.unlink(file.path);

    res.send(successResponse("Successfully saved media", media));
  }

  async delete(req: Request, res: Response) {
    await mediaService.delete(req.body._id);
    await deleteFromCloud(req.body.public_id);

    res.send(successResponse("Successfully deleted media"));
  }

  async deleteByUrl(req: Request, res: Response) {
    console.log({ url: req.body.url });
    await mediaService.deleteByUrl(req.body.url);
    res.send(successResponse("Successfully deleted media"));
  }
}

export default new MediaController();
