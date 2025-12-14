import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";
import {
  IInventoryItemRequest,
  InventoryStatus,
} from "./inventory-items.types";

export const getInventoryItemsSchema = paginationQuerySchema.shape({
  status: yup.string().optional().label("Status"),
  category: yup.string().optional().label("Category"),
  search: yup.string().optional().label("Search query"),
  stockFilter: yup
    .string()
    .oneOf(["outOfStock", "lowStock", "inStock", "expired"])
    .optional()
    .label("Stock filter"),
});

export type GetInventoryItemsQuerySchema = yup.InferType<
  typeof getInventoryItemsSchema
>;

const inventoryUnitSchema = yup
  .object({
    id: yup
      .string()
      .required()
      .label("Unit ID")
      .test("is-valid-objectid", "Invalid unit ID", (value) => {
        if (!value) return false;
        // Must be valid ObjectId format (24 hex characters)
        return /^[0-9a-fA-F]{24}$/.test(value);
      }),
    name: yup.string().required().label("Unit name"),
    plural: yup.string().required().label("Unit plural"),
    quantity: yup.number().optional().label("Quantity"),
  })
  .required();

const imageSchema = yup
  .object({
    url: yup.string().optional().label("Image URL"),
    mediaId: yup.string().optional().label("Media ID"),
  })
  .optional();

const categoryObjectSchema = yup
  .object({
    _id: yup
      .string()
      .required()
      .label("Category ID")
      .test("is-valid-objectid", "Invalid category ID", (value) => {
        if (!value) return false;
        return /^[0-9a-fA-F]{24}$/.test(value);
      }),
    name: yup.string().required().label("Category name"),
  })
  .required();

export const createInventoryItemSchema = yup
  .object<IInventoryItemRequest>({
    name: yup.string().required().label("Name"),
    category: categoryObjectSchema,
    units: yup.array(inventoryUnitSchema).min(1).required().label("Units"),
    lowStockValue: yup.number().required().label("Low stock value"),
    status: yup
      .mixed<InventoryStatus>()
      .oneOf(["active", "disabled", "deleted"])
      .required()
      .label("Status"),
    currentStockInBaseUnits: yup
      .number()
      .optional()
      .label("Current stock in base units"),
    image: imageSchema,
  })
  .required();

export const updateInventoryItemSchema = yup.object<
  Partial<IInventoryItemRequest>
>({
  name: yup.string().label("Name"),
  category: categoryObjectSchema.optional(),
  units: yup.array(inventoryUnitSchema).label("Units"),
  lowStockValue: yup.number().required().label("Low stock value"),
  status: yup
    .mixed<InventoryStatus>()
    .oneOf(["active", "disabled", "deleted"])
    .label("Status"),
  currentStockInBaseUnits: yup.number().label("Current stock in base units"),
  image: imageSchema,
});
