import {
  BankAccountVerificationResult,
  SingleTransferRequest,
} from "../lib/interfaces";
import {
  IEmployee,
  IEmployeeWithBank,
} from "../modules/employees/employees.types";
import { generateRandomString } from "./token";

export const getCurrentMonth = () => {
  return new Date().toLocaleString("default", {
    month: "long",
  });
};

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

export const getErrMsgForEmployeesWithoutBank = (employees: IEmployee[]) => {
  const employeesWithoutBank = employees.filter((employee) => !employee.bank);
  if (employeesWithoutBank.length === 0) return null;

  const names = employeesWithoutBank.map((x) => x.name).join(", ");
  return `Please add bank details to the following employees: ${names}`;
};

export const formatBankDetails = (
  bankDetails: BankAccountVerificationResult,
  otherProps: {
    bank_name: string;
    bank_code: string;
  }
) => {
  return {
    bank_name: otherProps.bank_name,
    bank_code: otherProps.bank_code,
    bank_id: bankDetails.bank_id,
    account_name: bankDetails.account_name,
    account_number: bankDetails.account_number,
  };
};

export const createTransferRequest = (
  employee: IEmployeeWithBank
): SingleTransferRequest => {
  const month = getCurrentMonth();
  const year = getCurrentYear();

  return {
    amountInKobo: employee.salary * 100,
    recipient: {
      name: employee.name,
      account_number: employee.bank.account_number,
      bank_code: employee.bank.bank_code,
      type: "nuban",
      currency: "NGN",
    },
    reason: `CMHO Salary for ${month}, ${year}`,
    reference: `CMHO_${Date.now()}_${generateRandomString(5)}`,
    recipient_code: employee.paystack_recipient_code,
  };
};

export const getTotalTransferAmountInKobo = (
  transfers: SingleTransferRequest[]
) => {
  return transfers.reduce((acc, transfer) => acc + transfer.amountInKobo, 0);
};

export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
