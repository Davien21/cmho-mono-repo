import * as yup from "yup";
import { GalleryRequest, GalleryCategory } from "./gallery.types";
import { paginationQuerySchema } from "../../validators/general.validator";

export const createGallerySchema = yup.object<GalleryRequest>({
  name: yup.string().optional().trim().label("Name"),
  file: yup.string().optional(), // File validation is handled by multer
  category: yup
    .string()
    .oneOf(Object.values(GalleryCategory))
    .optional()
    .label("Category"),
});

export const updateGallerySchema = yup.object<Partial<GalleryRequest>>({
  name: yup.string().optional().trim().label("Name"),
  category: yup
    .string()
    .oneOf(Object.values(GalleryCategory))
    .optional()
    .label("Category"),
});

export const galleryUpload = yup.object({
  file: yup.string().optional(),
  category: yup.string().optional(),
});

export const getGalleryItemsQuerySchema = paginationQuerySchema.shape({
  category: yup.string().oneOf(Object.values(GalleryCategory)).optional(),
});

export type GetGalleryItemsQuerySchema = yup.InferType<
  typeof getGalleryItemsQuerySchema
>;

