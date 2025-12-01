import type { AxiosError } from 'axios';

import { successResponse } from '../../utils/response';
import { Request, Response } from 'express';
import { BadRequestError } from '../../config/errors';
import paystackClient from '../../lib/paystack';

export async function verifyAccount(req: Request, res: Response) {
  const { account_number, bank_code } = req.body;

  try {
    const data = await paystackClient.validateBank(account_number, bank_code);

    res.send(successResponse('Account verified successfully', data));
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ code: string }>;

    const code = axiosError?.response?.data?.code;
    if (code === 'invalid_bank_code') throw new BadRequestError('Invalid Account Details');

    throw new BadRequestError('Bank verification failed');
  }
}

export async function getNigerianBanks(_req: Request, res: Response) {
  try {
    const banks = await paystackClient.getNigerianBanks();

    if (!banks) throw new BadRequestError('Failed to fetch banks');

    const nigerianBanks = banks.filter((bank) => bank.currency === 'NGN');

    res.send(successResponse('Banks fetched successfully', nigerianBanks));
  } catch (error: unknown) {
    const axiosError = error as AxiosError;

    console.error('Failed to fetch banks from Paystack:', axiosError.message);
    res.send(successResponse('Failed to fetch banks from Paystack'));
  }
}
