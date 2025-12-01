import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";

export const getInventoryItemsSchema = paginationQuerySchema.shape({
  status: yup.string().optional().label("Status"),
  setupStatus: yup.string().optional().label("Setup status"),
  category: yup.string().optional().label("Category"),
  search: yup.string().optional().label("Search query"),
});

export type GetInventoryItemsQuerySchema = yup.InferType<
  typeof getInventoryItemsSchema
>;


