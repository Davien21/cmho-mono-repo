import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";
import { StockEntryRequest } from "./stock-entries.types";

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

export const createStockEntrySchema = yup
  .object<StockEntryRequest>({
    inventoryItemId: yup.string().required().label("Inventory item ID"),
    operationType: yup
      .string()
      .required()
      .oneOf(["add", "reduce"])
      .label("Operation type"),
    supplier: yup
      .object({
        supplierId: yup.string().required().label("Supplier ID"),
        name: yup.string().required().label("Supplier name"),
      })
      .nullable()
      .optional()
      .label("Supplier"),
    costPrice: yup.number().required().label("Cost price"),
    sellingPrice: yup.number().required().label("Selling price"),
    expiryDate: yup
      .date()
      .required()
      .typeError("Expiry date must be a valid date")
      .label("Expiry date"),
    quantityInBaseUnits: yup
      .number()
      .required()
      .label("Quantity in base units"),
  })
  .required();

