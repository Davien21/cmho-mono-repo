import * as yup from 'yup';
import { paginationQuerySchema } from '../../validators/general.validator';
import { TransactionStatus } from './transactions.types';

export const getTransactionsSchema = paginationQuerySchema.shape({
  search: yup.string().optional().label('Search query'),
  status: yup
    .string()
    .optional()
    .oneOf(Object.values(TransactionStatus), 'Invalid transaction status')
    .label('Transaction status filter'),
});

export type GetTransactionsQuerySchema = yup.InferType<typeof getTransactionsSchema>;
