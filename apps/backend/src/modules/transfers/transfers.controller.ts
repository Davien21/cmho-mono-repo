import { Request, Response } from 'express';
import { BadRequestError, NotFoundError } from '../../config/errors';
import { successResponse } from '../../utils/response';
import transfersService from './transfers.service';
import { ESortOrder, ETransferType } from '../../lib/interfaces';
import { AxiosError } from 'axios';
import employeesService from '../employees/employees.service';

import { TransferQuerySchema } from './transfers.validation';
import {
  createTransferRequest,
  getErrMsgForEmployeesWithoutBank,
  getTotalTransferAmountInKobo,
} from '../../utils/random';
import { IEmployeeWithBank } from '../employees/employees.types';
import { ITransaction, TransactionStatus } from '../transactions/transactions.types';
import { ITransfer } from './transfers.types';
import paystackClient from '../../lib/paystack';
import mongoose from 'mongoose';
import transactionsService from '../transactions/transactions.service';

const { Types } = mongoose;
/**
 * Initiate a single transfer
 */
export async function initiateSingleTransfer(req: Request, res: Response) {
  try {
    const { employeeIds } = req.body;

    const employeeId = employeeIds[0];

    const employee = await employeesService.findById(employeeId).lean();

    if (!employee) throw new NotFoundError('Employee not found');

    if (!employee.bank) {
      throw new BadRequestError("Please add this employee's bank details");
    }

    if (!employee.paystack_recipient_code) {
      throw new BadRequestError('Employee is missing a paystack recipient code');
    }

    const transferDetails = createTransferRequest(employee as IEmployeeWithBank);

    await paystackClient.initiateTransfer(transferDetails);

    // Store transfer in database first
    const transferRecord: Omit<ITransfer, '_id'> = {
      amountInKobo: transferDetails.amountInKobo,
      type: ETransferType.SINGLE,
      transactionCount: 1,
    };

    const storedTransfer = await transfersService.create(transferRecord);
    // Store transaction linked to the transfer
    const transactionRecord: Omit<ITransaction, '_id'> = {
      amountInKobo: transferDetails.amountInKobo,
      transfer: storedTransfer._id,
      employee: employee._id,
      paystackTxReference: transferDetails.reference,
      status: TransactionStatus.PENDING,
      paystackMeta: {
        webhookProcessed: false,
      },
    };

    await transactionsService.create(transactionRecord);

    await employeesService.update(employeeId, {
      last_paid_on: new Date(),
    });

    res.send(successResponse('Transfer initiated successfully'));
  } catch (error: unknown) {
    console.log(error);
    const axiosError = error as AxiosError<{ message: string; code: string }>;
    const errorMessage = axiosError?.response?.data?.message;
    const errorCode = axiosError?.response?.data?.code;

    console.log({ errorMessage, errorCode });

    if (errorMessage) throw new BadRequestError(errorMessage);

    if (errorCode === 'insufficient_balance') {
      throw new BadRequestError('Insufficient balance');
    }

    throw new BadRequestError('Transfer initiation failed');
  }
}

/**
 * Initiate bulk transfers
 */
export async function initiateBulkTransfers(req: Request, res: Response) {
  try {
    const { employeeIds } = req.body;

    const employees = await employeesService.findByIds(employeeIds).lean();

    const missingBanksErr = getErrMsgForEmployeesWithoutBank(employees);
    if (missingBanksErr) throw new BadRequestError(missingBanksErr);

    const filteredEmployees = employees as IEmployeeWithBank[];

    const bulkTransferData = filteredEmployees.map((x) => createTransferRequest(x));

    // Initiate bulk transfers with Paystack
    await paystackClient.initiateBulkTransfers(bulkTransferData);

    const totalAmountInKobo = getTotalTransferAmountInKobo(bulkTransferData);

    // Store transfer in database first
    const transferRecord: Omit<ITransfer, '_id'> = {
      amountInKobo: totalAmountInKobo,
      type: ETransferType.BULK,
      transactionCount: bulkTransferData.length,
    };

    const storedTransfer = await transfersService.create(transferRecord);

    // Store transactions for each employee
    const transactionRecords = bulkTransferData.map((x, i) => ({
      amountInKobo: x.amountInKobo,
      transfer: storedTransfer._id,
      employee: new Types.ObjectId(employeeIds[i]),
      paystackTxReference: x.reference,
      status: TransactionStatus.PENDING,
      paystackMeta: {
        webhookProcessed: false,
      },
    }));

    await transactionsService.createMany(transactionRecords);

    await employeesService.updateMany(employeeIds, {
      last_paid_on: new Date(),
    });

    res.send(successResponse('Bulk payment initiated successfully'));
  } catch (error: unknown) {
    console.log(error);
    const axiosError = error as AxiosError<{ message: string; code: string }>;

    const errorMessage = axiosError?.response?.data?.message;
    const errorCode = axiosError?.response?.data?.code;

    console.log({ errorMessage, errorCode });

    if (errorMessage) throw new BadRequestError(errorMessage);

    if (errorCode === 'insufficient_balance') {
      throw new BadRequestError('Insufficient balance to complete bulk transfers');
    }

    throw new BadRequestError('Bulk transfer initiation failed');
  }
}

/**
 * Get transactions by transfer ID
 */
export async function getTransactionsByTransferId(req: Request, res: Response) {
  try {
    const { transferId } = req.params;

    if (!transferId) {
      throw new BadRequestError('Transfer ID is required');
    }

    const result = await transactionsService.getTransactionsByTransferId(transferId);

    res.send(successResponse('Transactions retrieved successfully', result));
  } catch (error: unknown) {
    throw new BadRequestError('Failed to retrieve transactions');
  }
}

/**
 * Get stored transfers from database with filtering, sorting, and pagination
 */
export async function getStoredTransfers(
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    TransferQuerySchema
  >,
  res: Response
) {
  const { page = '1', limit = '10', sort = ESortOrder.DESC, status } = req.query;

  console.log({ page, limit, sort, status });

  const result = await transfersService.getTransfers({
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    status,
  });

  res.send(successResponse('Transfers retrieved successfully', result));
}

/**
 * Get transactions from database with filtering, sorting, and pagination
 */
export async function getTransactionsOnTransfer(req: Request, res: Response) {
  const { transferId } = req.params;

  const transfer = await transfersService.findById(transferId);

  if (!transfer) throw new NotFoundError('Transfer not found');

  const transactions = await transactionsService.getTransactionsByTransferId(transferId);

  res.send(
    successResponse('Transactions retrieved successfully', {
      ...transfer,
      transactions,
    })
  );
}

/**
 * Get transfer statistics
 */
export async function getTransferStats(_req: Request, res: Response) {
  const result = await transfersService.getTransferStats();

  res.send(successResponse('Transfer statistics retrieved successfully', result));
}
