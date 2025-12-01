import { Request, Response } from 'express';
import employeeService from './employees.service';
import { errorResponse, successResponse } from '../../utils/response';
import banksService from '../banks/banks.service';
import { IEmployee, IEmployeeBank } from './employees.types';
import { PaystackTransferRecipient } from '../../lib/interfaces';
import { GetEmployeesQuerySchema } from './employees.validators';
import paystackClient from '../../lib/paystack';
import { formatBankDetails } from '../../utils/random';
import { NotFoundError } from '../../config/errors';

export async function getEmployees(
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    GetEmployeesQuerySchema
  >,
  res: Response
) {
  try {
    const { sort = 'asc', limit = '10', page = '1' } = req.query;

    const employees = await employeeService.getEmployees({
      sort: sort === 'desc' ? -1 : 1,
      limit: parseInt(limit),
      page: parseInt(page),
    });

    res.send(successResponse('Employees fetched successfully', employees));
  } catch (_error) {
    res.status(500).send(errorResponse('Failed to fetch employees'));
  }
}

export async function createEmployee(req: Request, res: Response) {
  const { name, position, salary, bank: bankDetails } = req.body as IEmployee;
  let paystackRecipient: PaystackTransferRecipient | undefined;
  let bank: IEmployeeBank | null = null;

  if (bankDetails) {
    const bankVerificationData = await banksService.validateBank(
      bankDetails.account_number,
      bankDetails.bank_code
    );

    bank = formatBankDetails(bankVerificationData, bankDetails);

    // Create Paystack recipient
    paystackRecipient = await paystackClient.createTransferRecipient({
      type: 'nuban',
      name,
      account_number: bank.account_number,
      bank_code: bank.bank_code,
      currency: 'NGN',
    });
  }

  const paystack_recipient_code = paystackRecipient?.recipient_code || null;

  const employee = await employeeService.create({
    name,
    position,
    salary,
    bank,
    paystack_recipient_code,
  });
  res.send(successResponse('Employee created successfully', employee));
}

export async function updateEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const { name, position, salary, bank: bankDetails } = req.body as IEmployee;
  let paystackRecipient: PaystackTransferRecipient | undefined;
  let bank: IEmployeeBank | null = null;

  const employee = await employeeService.findById(id).lean();
  if (!employee) throw new NotFoundError('Employee not found');

  if (bankDetails && !employee.bank) {
    const bankVerificationData = await banksService.validateBank(
      bankDetails.account_number,
      bankDetails.bank_code
    );

    bank = formatBankDetails(bankVerificationData, bankDetails);

    // Create Paystack recipient
    paystackRecipient = await paystackClient.createTransferRecipient({
      type: 'nuban',
      name,
      account_number: bank.account_number,
      bank_code: bank.bank_code,
      currency: 'NGN',
    });
  }

  const recipient_code = paystackRecipient?.recipient_code || null;

  await employeeService.update(id, {
    name,
    position,
    salary,
    bank: bank || employee.bank,
    paystack_recipient_code: recipient_code || employee.paystack_recipient_code,
  });

  res.send(successResponse('Employee updated successfully'));
}
