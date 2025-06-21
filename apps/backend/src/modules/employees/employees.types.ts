import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export interface IEmployeeBank {
  bank_name: string;
  bank_code: string;
  bank_id: number;
  account_name: string;
  account_number: string;
}

export interface IEmployee {
  _id: ObjectId;
  name: string;
  salary: number;
  position: string;
  bank: IEmployeeBank | null;
  paystack_recipient_code?: string | null;
  last_paid_on?: Date | null;
}

export interface IEmployeeWithBank extends IEmployee {
  bank: IEmployeeBank;
  paystack_recipient_code: string;
}
