import { successResponse } from '../../utils/response';
import { Request, Response } from 'express';

import employeeService from '../employees/employees.service';
import { BadRequestError } from '../../config/errors';
import { AxiosError } from 'axios';
import paystackClient from '../../lib/paystack';

export async function getDashboardStats(_req: Request, res: Response) {
  const employeeStats = await employeeService.getEmployeeStats();
  const balances = await paystackClient.getAccountBalances();
  const nairaBalance = (
    balances.find((b) => b.currency === 'NGN') || {
      balance: 0,
    }
  ).balance;

  const balanceInNaira = nairaBalance ? nairaBalance / 100 : 0;

  const result = { ...employeeStats, accountBalance: balanceInNaira };

  res.send(successResponse('Dashboard stats fetched successfully', result));
}

/**
 * Get account balance
 */
export async function getAccountBalance(_req: Request, res: Response) {
  try {
    const balances = await paystackClient.getAccountBalances();
    const balanceInNaira = balances[0].balance * 100;

    const result = { accountBalance: balanceInNaira };

    res.send(successResponse('Account balance retrieved successfully', result));
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;

    if (axiosError?.response?.data?.message) {
      throw new BadRequestError(axiosError.response.data.message);
    }

    throw new BadRequestError('Failed to retrieve account balance');
  }
}
