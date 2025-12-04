import * as yup from "yup";
import { IInventoryCategoryRequest } from "./inventory-categories.types";

export const createInventoryCategorySchema = yup
  .object<IInventoryCategoryRequest>({
    name: yup.string().required().label("Name"),
    // Accept object ids as strings from the client
    unitPresetIds: yup
      .array(yup.string().label("Default unit preset ID"))
      .optional()
      .label("Default unit preset IDs"),
    canBeSold: yup.boolean().optional().label("Can be sold"),
    order: yup.number().optional().label("Order"),
  })
  .required();

export const updateInventoryCategorySchema = yup.object<
  Partial<IInventoryCategoryRequest>
>({
  name: yup.string().label("Name"),
  unitPresetIds: yup
    .array(yup.string().label("Default unit preset ID"))
    .optional()
    .label("Default unit preset IDs"),
  canBeSold: yup.boolean().optional().label("Can be sold"),
  order: yup.number().optional().label("Order"),
});

export const reorderInventoryCategoriesSchema = yup
  .object({
    categoryOrders: yup
      .array(
        yup
          .object({
            id: yup.string().required().label("Category ID"),
            order: yup.number().required().label("Order"),
          })
          .required()
      )
      .required()
      .label("Category orders"),
  })
  .required();
