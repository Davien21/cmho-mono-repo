import * as yup from "yup";
import { GalleryRequest } from "./gallery.types";

export const createGallerySchema = yup.object<GalleryRequest>({
  name: yup.string().optional().trim().label("Name"),
  file: yup.string().optional(), // File validation is handled by multer
});

export const updateGallerySchema = yup.object<Partial<GalleryRequest>>({
  name: yup.string().optional().trim().label("Name"),
});

export const galleryUpload = yup.object({
  file: yup.string().optional(),
});

