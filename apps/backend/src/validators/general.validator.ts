import * as yup from 'yup';
import { ESortOrder } from '../lib/interfaces';
import { TransferStatus } from '../modules/transfers/transfers.types';

export const sortValidator = yup
  .string()
  .optional()
  .oneOf(Object.values(ESortOrder), 'Invalid sort order');

export const pageValidator = yup
  .string()
  .optional()
  .matches(/^\d+$/, 'Page must be a number')
  .test('min', 'Minimum page is 1', (value) => {
    if (!value) return true;
    return Number(value) >= 1;
  });

export const limitValidator = yup
  .string()
  .optional()
  .matches(/^\d+$/, 'Limit must be a number')
  .test('min', 'Minimum limit is 1', (value) => {
    if (!value) return true;
    return Number(value) >= 1;
  })
  .test('max', 'Maximum limit is 100', (value) => {
    if (!value) return true;
    return Number(value) <= 100;
  });

export const statusValidator = yup
  .string()
  .optional()
  .oneOf(Object.values(TransferStatus), 'Invalid status filter');

export const paginationQuerySchema = yup.object({
  page: pageValidator,
  limit: limitValidator,
  sort: sortValidator,
});

export type PaginationQuerySchema = yup.InferType<typeof paginationQuerySchema>;
