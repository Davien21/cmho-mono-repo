import { Plus, Users } from "lucide-react";
import { AddEmployeeButton } from "./AddEmployeeButton";

export const NoEmployees = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border p-8 sm:p-12">
      <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No employees yet
      </h3>
      <p className="text-gray-600 mb-4 text-sm sm:text-base">
        Get started by adding your first employee
      </p>
      <AddEmployeeButton>
        <Plus className="w-5 h-5" />
        Add Employee
      </AddEmployeeButton>
    </div>
  );
};
