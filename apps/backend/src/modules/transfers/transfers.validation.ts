import * as yup from 'yup';
import { TransferStatus } from './transfers.types';
import { paginationQuerySchema } from '../../validators/general.validator';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const runTransferSchema = yup.object({
  employeeIds: yup
    .array()
    .of(yup.string().matches(objectIdRegex, 'Invalid employee ID in this list'))
    .required('Employee IDs are required')
    .min(1, 'At least one employee ID is required')
    .max(100, 'A maximum of 100 employees can be paid every 5 minutes'),
});

// Transfer recipient validation schema
export const transferRecipientSchema = yup.object({
  type: yup.string().oneOf(['nuban']).default('nuban'),
  name: yup
    .string()
    .required('Recipient name is required')
    .min(2, 'Name must be at least 2 characters'),
  account_number: yup
    .string()
    .required('Account number is required')
    .matches(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  bank_code: yup
    .string()
    .required('Bank code is required')
    .matches(/^\d{3}$/, 'Bank code must be exactly 3 digits'),
  currency: yup.string().oneOf(['NGN']).default('NGN'),
});

// Single transfer validation schema
export const singleTransferSchema = yup.object({
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .min(100, 'Minimum transfer amount is ₦100')
    .max(10000000, 'Maximum transfer amount is ₦10,000,000'),
  recipient: transferRecipientSchema.required('Recipient details are required'),
  employeeId: yup.string().required('Employee ID is required'),
  reason: yup.string().optional().max(200, 'Reason cannot exceed 200 characters'),
  reference: yup
    .string()
    .optional()
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      'Reference can only contain letters, numbers, hyphens, and underscores'
    )
    .max(100, 'Reference cannot exceed 100 characters'),
});

// Bulk transfer validation schema
export const bulkTransferSchema = yup.object({
  transfers: yup
    .array()
    .of(
      yup.object({
        amount: yup
          .number()
          .required('Amount is required')
          .positive('Amount must be positive')
          .min(100, 'Minimum transfer amount is ₦100')
          .max(10000000, 'Maximum transfer amount is ₦10,000,000'),
        recipient: transferRecipientSchema.required('Recipient details are required'),
        reason: yup.string().optional().max(200, 'Reason cannot exceed 200 characters'),
      })
    )
    .required('Transfers array is required')
    .min(1, 'At least one transfer is required')
    .max(100, 'Maximum of 100 transfers allowed per batch'),
  employeeIds: yup
    .array()
    .of(yup.string().required())
    .required('Employee IDs array is required')
    .min(1, 'At least one employee ID is required'),
});

// Transaction query validation schema
export const transactionQuerySchema = paginationQuerySchema;

// Transfer query validation schema
export const transferQuerySchema = paginationQuerySchema.shape({
  status: yup.string().optional().oneOf(Object.values(TransferStatus), 'Invalid status filter'),
});

export type TransferQuerySchema = yup.InferType<typeof transferQuerySchema>;
