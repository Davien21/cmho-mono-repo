import express from "express";
const router = express.Router();

import { generalMulter } from "../../lib/multer";
import validateBy from "../../middlewares/validator";
import { mediaUpload } from "../media/media.validators";
import mediaController from "./media.controller";

router.get("/media", mediaController.getAll);

router.post(
  "/media",
  [generalMulter.single("file"), validateBy(mediaUpload)],
  mediaController.create
);

router.post("/media/delete", mediaController.delete);

router.post("/media/delete-by-url", mediaController.deleteByUrl);

export default router;
