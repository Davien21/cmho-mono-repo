import * as yup from 'yup';
import { IInventoryUnitDefinitionRequest } from './inventory-units.types';

export const createInventoryUnitSchema = yup
  .object<IInventoryUnitDefinitionRequest>({
    name: yup.string().required().label('Name'),
    plural: yup.string().required().label('Plural'),
  })
  .required();

export const updateInventoryUnitSchema = yup.object<Partial<IInventoryUnitDefinitionRequest>>({
  name: yup.string().label('Name'),
  plural: yup.string().label('Plural'),
});
