import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";

export const getStockEntriesSchema = paginationQuerySchema.shape({
  inventoryItemId: yup.string().optional().label("Inventory item ID"),
  operationType: yup
    .string()
    .optional()
    .oneOf(["add", "reduce"])
    .label("Operation type"),
});

export type GetStockEntriesQuerySchema = yup.InferType<
  typeof getStockEntriesSchema
>;


