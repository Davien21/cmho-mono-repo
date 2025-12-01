import * as yup from 'yup';
import { IEmployee } from './employees.types';
import { IBank } from '../../lib/interfaces';
import { paginationQuerySchema } from '../../validators/general.validator';

export const createEmployeeSchema = yup
  .object<IEmployee>({
    name: yup.string().required().label('Name'),
    salary: yup.number().required().label('Salary'),
    position: yup.string().required().label('Position'),
    bank: yup
      .object<IBank>({
        bank_name: yup.string().label('Bank Name'),
        bank_code: yup.string().label('Bank Code'),
      })
      .label('Bank'),
  })
  .required();

export const updateEmployeeSchema = yup.object<IEmployee>({
  name: yup.string().label('Name'),
  salary: yup.number().label('Salary'),
  position: yup.string().label('Position'),
  bank: yup
    .object<IBank>({
      bank_name: yup.string().label('Bank Name'),
      bank_code: yup.string().label('Bank Code'),
    })
    .label('Bank'),
});

export const getEmployeesSchema = paginationQuerySchema;

export type GetEmployeesQuerySchema = yup.InferType<typeof getEmployeesSchema>;
