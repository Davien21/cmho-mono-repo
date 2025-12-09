import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";
import { StockMovementRequest } from "./stock-movement.types";

export const getStockMovementSchema = paginationQuerySchema.shape({
  inventoryItemId: yup.string().optional().label("Inventory item ID"),
  operationType: yup
    .string()
    .optional()
    .oneOf(["add", "reduce"])
    .label("Operation type"),
  search: yup.string().optional().label("Search query"),
});

export type GetStockMovementQuerySchema = yup.InferType<
  typeof getStockMovementSchema
>;

// Legacy schema for backward compatibility (if needed)
export const createStockMovementSchema = yup
  .object<StockMovementRequest>({
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
    costPrice: yup.number().when("operationType", {
      is: "add",
      then: (schema) => schema.required().label("Cost price"),
      otherwise: (schema) => schema.optional().nullable().label("Cost price"),
    }),
    sellingPrice: yup.number().when("operationType", {
      is: "add",
      then: (schema) => schema.required().label("Selling price"),
      otherwise: (schema) =>
        schema.optional().nullable().label("Selling price"),
    }),
    expiryDate: yup.date().when("operationType", {
      is: "add",
      then: (schema) =>
        schema
          .required()
          .typeError("Expiry date must be a valid date")
          .label("Expiry date"),
      otherwise: (schema) =>
        schema
          .optional()
          .nullable()
          .typeError("Expiry date must be a valid date")
          .label("Expiry date"),
    }),
    quantityInBaseUnits: yup
      .number()
      .required()
      .label("Quantity in base units"),
  })
  .required();

// Schema for adding stock (requires all fields)
export const addStockSchema = yup
  .object({
    inventoryItemId: yup.string().required().label("Inventory item ID"),
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
      .positive()
      .label("Quantity in base units"),
  })
  .required();

// Schema for reducing stock (costPrice, sellingPrice, expiryDate are optional)
export const reduceStockSchema = yup
  .object({
    inventoryItemId: yup.string().required().label("Inventory item ID"),
    supplier: yup
      .object({
        supplierId: yup.string().required().label("Supplier ID"),
        name: yup.string().required().label("Supplier name"),
      })
      .nullable()
      .optional()
      .label("Supplier"),
    costPrice: yup.number().optional().nullable().label("Cost price"),
    sellingPrice: yup.number().optional().nullable().label("Selling price"),
    expiryDate: yup
      .date()
      .optional()
      .nullable()
      .typeError("Expiry date must be a valid date")
      .label("Expiry date"),
    quantityInBaseUnits: yup
      .number()
      .required()
      .positive()
      .label("Quantity in base units"),
  })
  .required();
