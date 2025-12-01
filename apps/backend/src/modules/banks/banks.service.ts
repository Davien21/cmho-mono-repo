import { AxiosError } from 'axios';
import paystackClient from '../../lib/paystack';
import { BadRequestError } from '../../config/errors';
import { BANK_VERIFICATION_ERRORS, TBankVerificationErrors } from './banks.constants';

class BanksService {
  async validateBank(accountNumber: string, bankCode: string) {
    try {
      const response = await paystackClient.validateBank(accountNumber, bankCode);

      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ code: string }>;

      const code = axiosError?.response?.data?.code as TBankVerificationErrors;

      if (Object.values(BANK_VERIFICATION_ERRORS).includes(code))
        throw new BadRequestError('Invalid Account Details');

      throw new BadRequestError('Bank verification failed');
    }
  }
}

const banksService = new BanksService();

export default banksService;
