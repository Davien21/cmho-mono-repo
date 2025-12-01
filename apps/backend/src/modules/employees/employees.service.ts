import Employee from './employees.model';
import { IEmployee } from './employees.types';

import { Document, Query } from 'mongoose';

class EmployeeService {
  async getEmployeeStats() {
    const result = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalMonthlySalaries: { $sum: '$salary' },
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

    return Employee.find().sort({ _id: sort }).limit(limit).skip(skip);
  }

  create(employee: Omit<IEmployee, '_id'>) {
    return Employee.create(employee);
  }

  findById(id: string) {
    return Employee.findById(id);
  }

  findByIds(ids: string[]) {
    return Employee.find({ _id: { $in: ids } });
  }

  update(id: any, updateQuery: Partial<Omit<IEmployee, '_id'>>) {
    return Employee.findByIdAndUpdate(id, updateQuery, { new: true });
  }

  updateMany(ids: string[], updateQuery: Partial<Omit<IEmployee, '_id'>>) {
    return Employee.updateMany({ _id: { $in: ids } }, updateQuery, {
      new: true,
    });
  }

  delete(id: string) {
    return Employee.findByIdAndDelete(id);
  }

  getBankDetails(employeeId: string) {
    return Employee.findOne({ _id: employeeId }).select('bank');
  }
}

export default new EmployeeService();
