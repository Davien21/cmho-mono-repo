import express from "express";
const router = express.Router();

import { generalMulter } from "../../lib/multer";
import validateBy from "../../middlewares/validator";
import { mediaUpload } from "../media/media.validators";
import mediaController from "./media.controller";
import { authenticate } from "../../middlewares/authentication";

// ============================================================================
// REST API Endpoints (New - replaces Gallery)
// ============================================================================

/**
 * GET /media
 * Get paginated list of media
 * Query params: page, limit, category
 */
router.get("/media", [authenticate], mediaController.getAll);

/**
 * GET /media/:id
 * Get single media item
 */
router.get("/media/:id", [authenticate], mediaController.getOne);

/**
 * POST /media
 * Create new media (upload file)
 */
router.post(
  "/media",
  [authenticate, generalMulter.single("file"), validateBy(mediaUpload)],
  mediaController.create
);

/**
 * PUT /media/:id
 * Update media metadata (name, category)
 */
router.put("/media/:id", [authenticate], mediaController.update);

/**
 * DELETE /media/:id
 * Delete media by ID (soft delete)
 */
router.delete("/media/:id", [authenticate], mediaController.deleteById);

// ============================================================================
// Legacy Endpoints (Kept for backward compatibility)
// ============================================================================

/**
 * POST /media/delete
 * Legacy: Delete by public_id
 */
router.post("/media/delete", [authenticate], mediaController.delete);

/**
 * POST /media/delete-by-url
 * Legacy: Delete by URL
 */
router.post("/media/delete-by-url", [authenticate], mediaController.deleteByUrl);

/**
 * POST /media/transcribe
 * AI transcription endpoint
 */
router.post("/media/transcribe", [authenticate], mediaController.transcribeImage);

export default router;
