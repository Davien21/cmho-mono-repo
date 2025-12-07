import Employee from "./employees.model";
import { IEmployee } from "./employees.types";

import { Document, Query } from "mongoose";

class EmployeeService {
  async getEmployeeStats() {
    const result = await Employee.aggregate([
      {
        $match: { isDeleted: { $ne: true } },
      },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalMonthlySalaries: { $sum: "$salary" },
        },
      },
      {
        $project: {
          _id: 0,
          totalEmployees: 1,
          totalMonthlySalaries: 1,
        },
      },
    ]);

    return result[0] || { totalEmployees: 0, totalMonthlySalaries: 0 };
  }

  getEmployees({
    sort = 1,
    limit = 10,
    page = 1,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
  }) {
    const skip = (page - 1) * limit;

    return Employee.find({ isDeleted: { $ne: true } })
      .sort({ _id: sort })
      .limit(limit)
      .skip(skip);
  }

  create(employee: Omit<IEmployee, "_id">) {
    return Employee.create(employee);
  }

  findById(id: string) {
    return Employee.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  findByIds(ids: string[]) {
    return Employee.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
  }

  update(id: any, updateQuery: Partial<Omit<IEmployee, "_id">>) {
    return Employee.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateQuery,
      { new: true }
    );
  }

  updateMany(ids: string[], updateQuery: Partial<Omit<IEmployee, "_id">>) {
    return Employee.updateMany(
      { _id: { $in: ids }, isDeleted: { $ne: true } },
      updateQuery,
      {
        new: true,
      }
    );
  }

  delete(id: string) {
    return Employee.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  getBankDetails(employeeId: string) {
    return Employee.findOne({ _id: employeeId, isDeleted: { $ne: true } }).select("bank");
  }
}

export default new EmployeeService();
