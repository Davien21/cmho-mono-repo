import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";

export const getNotificationsQuerySchema = paginationQuerySchema.shape({
  status: yup
    .string()
    .optional()
    .oneOf(["active", "resolved"], "Invalid status")
    .label("Status"),
  module: yup
    .string()
    .optional()
    .oneOf(["inventory", "salary", "admin"], "Invalid module")
    .label("Module"),
  type: yup
    .string()
    .optional()
    .oneOf(["out_of_stock", "low_stock"], "Invalid type")
    .label("Type"),
  inventoryId: yup.string().optional().label("Inventory ID"),
  title: yup.string().optional().label("Title"),
  search: yup.string().optional().label("Search"),
});

export type GetNotificationsQuerySchema = yup.InferType<
  typeof getNotificationsQuerySchema
>;
