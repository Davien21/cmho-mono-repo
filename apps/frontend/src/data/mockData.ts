import { IEmployee } from "../types";

export const employeeList: IEmployee[] = [
  {
    _id: "1",
    name: "Sarah Johnson",
    position: "Software Engineer",
    salary: 3570000,
    last_paid_on: new Date("2024-01-15"),
    bank: null,
  },
  {
    _id: "2",
    name: "Michael Chen",
    position: "Product Manager",
    salary: 3990000,
    last_paid_on: new Date("2024-01-15"),
    bank: null,
  },
  {
    _id: "3",
    name: "Emily Rodriguez",
    position: "UX Designer",
    salary: 3150000,
    last_paid_on: new Date("2024-01-15"),
    bank: null,
  },
];
