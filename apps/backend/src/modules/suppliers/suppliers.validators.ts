import * as yup from 'yup';
import { SupplierRequest } from './suppliers.types';

export const createSupplierSchema = yup
  .object<SupplierRequest>({
    name: yup.string().required().label('Name'),
    contact: yup
      .object({
        phone: yup.string().optional().label('Phone'),
        address: yup.string().optional().label('Address'),
      })
      .optional()
      .label('Contact'),
    status: yup.string().oneOf(['active', 'disabled', 'deleted']).optional().label('Status'),
  })
  .required();

export const updateSupplierSchema = yup.object<Partial<SupplierRequest>>({
  name: yup.string().label('Name'),
  contact: yup
    .object({
      phone: yup.string().optional().label('Phone'),
      address: yup.string().optional().label('Address'),
    })
    .optional()
    .label('Contact'),
  status: yup.string().oneOf(['active', 'disabled', 'deleted']).optional().label('Status'),
});
