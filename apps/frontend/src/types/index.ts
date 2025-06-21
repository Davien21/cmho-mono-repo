export interface IAPIResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface IAPIError extends IAPIResponse<null> {
  success: false;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
}

export type IConfirmationDialogType = "danger" | "warning" | "info";

export interface IConfirmationDialog {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: IConfirmationDialogType;
}

export interface IBank {
  name: string;
  code: string;
  id: number;
}

export interface IUserBank {
  bank_id: number;
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
}

export interface IEmployee {
  _id: string;
  name: string;
  salary: number;
  position: string;
  bank: IUserBank | null;
  last_paid_on: Date | string | null;
}

export interface IAddEmployeeRequest {
  name: string;
  salary: number;
  position: string;
  bank?: Omit<IUserBank, "account_name" | "bank_id">;
}

export interface IUpdateEmployeeRequest extends IAddEmployeeRequest {
  id: string;
}

export interface IGetEmployeesParams {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}

export interface IDashboardStats {
  totalEmployees: number;
  totalMonthlySalaries: number;
  accountBalance: number;
}

export interface RTKQueryAPIError {
  data: IAPIError;
  status: number;
}

export interface ITransfer {
  _id: string;
  amountInKobo: number;
  paystackReference: string;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export enum ITransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REVERSED = "reversed",
}

export interface ITransaction {
  _id: string;
  amountInKobo: number;
  transfer: string;
  employee: IEmployee;
  status: ITransactionStatus;
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITransferDetails extends ITransfer {
  transactions: ITransaction[];
}

export interface IQueryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ITransferResponse {
  transfers: ITransfer[];
  meta: IQueryMeta;
}

export enum ESortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface IGetTransfersParams {
  page?: number;
  limit?: number;
  sort?: ESortOrder;
}
