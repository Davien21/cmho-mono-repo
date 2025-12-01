import * as yup from 'yup';
import { IInventoryCategoryRequest } from './inventory-categories.types';

export const createInventoryCategorySchema = yup
  .object<IInventoryCategoryRequest>({
    name: yup.string().required().label('Name'),
    // Accept object ids as strings from the client
    unitPresetIds: yup
      .array(yup.string().label('Default unit preset ID'))
      .optional()
      .label('Default unit preset IDs'),
  })
  .required();

export const updateInventoryCategorySchema = yup.object<Partial<IInventoryCategoryRequest>>({
  name: yup.string().label('Name'),
  unitPresetIds: yup
    .array(yup.string().label('Default unit preset ID'))
    .optional()
    .label('Default unit preset IDs'),
});
