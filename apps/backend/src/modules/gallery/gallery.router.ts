import express from "express";
const router = express.Router();

import { generalMulter } from "../../lib/multer";
import validateBy from "../../middlewares/validator";
import { authenticate, requireSuperAdmin } from "../../middlewares/authentication";
import {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItem,
  getGalleryItems,
  updateGalleryItem,
} from "./gallery.controller";
import {
  galleryUpload,
  updateGallerySchema,
  getGalleryItemsQuerySchema,
} from "./gallery.validators";

router.get(
  "/gallery",
  [validateBy(getGalleryItemsQuerySchema, "query")],
  getGalleryItems
);

router.get("/gallery/:id", getGalleryItem);

router.post(
  "/gallery",
  [generalMulter.single("file"), validateBy(galleryUpload)],
  createGalleryItem
);

router.put(
  "/gallery/:id",
  [validateBy(updateGallerySchema)],
  updateGalleryItem
);

router.delete("/gallery/:id", [authenticate, requireSuperAdmin], deleteGalleryItem);

export default router;

