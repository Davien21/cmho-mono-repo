import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";
import {
  IInventoryItemRequest,
  InventorySetupStatus,
  InventoryStatus,
} from "./inventory-items.types";

export const getInventoryItemsSchema = paginationQuerySchema.shape({
  status: yup.string().optional().label("Status"),
  setupStatus: yup.string().optional().label("Setup status"),
  category: yup.string().optional().label("Category"),
  search: yup.string().optional().label("Search query"),
});

export type GetInventoryItemsQuerySchema = yup.InferType<
  typeof getInventoryItemsSchema
>;

const inventoryUnitSchema = yup
  .object({
    id: yup.string().required().label("Unit ID"),
    name: yup.string().required().label("Unit name"),
    plural: yup.string().required().label("Unit plural"),
    presetId: yup.string().optional().label("Preset ID"),
    quantity: yup.number().optional().label("Quantity"),
  })
  .required();

const imageSchema = yup
  .object({
    url: yup.string().optional().label("Image URL"),
    mediaId: yup.string().optional().label("Media ID"),
  })
  .optional();

export const createInventoryItemSchema = yup
  .object<IInventoryItemRequest>({
    name: yup.string().required().label("Name"),
    category: yup.string().required().label("Category"),
    units: yup.array(inventoryUnitSchema).min(1).required().label("Units"),
    lowStockValue: yup.number().optional().label("Low stock value"),
    setupStatus: yup
      .mixed<InventorySetupStatus>()
      .oneOf(["draft", "ready"])
      .required()
      .label("Setup status"),
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
  category: yup.string().label("Category"),
  units: yup.array(inventoryUnitSchema).label("Units"),
  lowStockValue: yup.number().label("Low stock value"),
  setupStatus: yup
    .mixed<InventorySetupStatus>()
    .oneOf(["draft", "ready"])
    .label("Setup status"),
  status: yup
    .mixed<InventoryStatus>()
    .oneOf(["active", "disabled", "deleted"])
    .label("Status"),
  currentStockInBaseUnits: yup.number().label("Current stock in base units"),
  image: imageSchema,
});
