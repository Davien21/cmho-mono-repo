import * as yup from "yup";
import { IInventoryUnitDefinitionRequest } from "./inventory-units.types";

export const createInventoryUnitSchema = yup
  .object<IInventoryUnitDefinitionRequest>({
    name: yup.string().required().label("Name"),
    plural: yup.string().required().label("Plural"),
    order: yup.number().optional().label("Order"),
  })
  .required();

export const updateInventoryUnitSchema = yup.object<
  Partial<IInventoryUnitDefinitionRequest>
>({
  name: yup.string().label("Name"),
  plural: yup.string().label("Plural"),
  order: yup.number().optional().label("Order"),
});

export const reorderInventoryUnitsSchema = yup
  .object({
    unitOrders: yup
      .array(
        yup
          .object({
            id: yup.string().required().label("Unit ID"),
            order: yup.number().required().label("Order"),
          })
          .required()
      )
      .required()
      .label("Unit orders"),
  })
  .required();
