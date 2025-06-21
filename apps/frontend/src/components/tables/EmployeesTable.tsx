import { useState } from "react";
import { Edit2, DollarSign } from "lucide-react";
import { IEmployee } from "../../types";
import { useModalContext } from "@/contexts/modal-context";
import {
  delay,
  pluralizePhrase,
  getRTKQueryErrorMessage,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useMultiplePaymentsMutation,
  useSinglePaymentMutation,
} from "@/store/transfers-slice";

interface EmployeesTableProps {
  employees: IEmployee[];
}

export function EmployeesTable({ employees }: EmployeesTableProps) {
  const [singlePayment] = useSinglePaymentMutation();
  const [multiplePayments] = useMultiplePaymentsMutation();
  const { openModal, closeModal } = useModalContext();

  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const handleEditEmployee = (employee: IEmployee) => {
    openModal("confirmation-dialog", {
      type: "info",
      title: "Confirm Edit",
      message: `Are you sure you want to edit ${employee.name}'s details?`,
      onConfirm: async () => {
        openModal("update-employee", employee);
        await delay(200);
        closeModal("confirmation-dialog");
      },
    });
  };

  const handlePayEmployee = async (employee: IEmployee) => {
    closeModal("confirmation-dialog");

    const loadingMessage = `Paying ${employee.name} ${formatNaira(
      employee.salary
    )}`;
    const toastId = toast.loading(loadingMessage);
    try {
      await singlePayment({ employeeIds: [employee._id] }).unwrap();
      const successMessage = `Salary payment initiated for ${
        employee.name
      } ${formatNaira(employee.salary)}`;
      toast.success(successMessage, { id: toastId });
    } catch (error: unknown) {
      const errorMessage = getRTKQueryErrorMessage(error);
      if (errorMessage) return toast.error(errorMessage, { id: toastId });

      toast.error("Failed to initiate salary payment", { id: toastId });
    }
  };

  const handlePayMultipleEmployees = async (employees: IEmployee[]) => {
    closeModal("confirmation-dialog");
    const employeeIds = employees.map((emp) => emp._id);

    const loadingMessage = `Salary payment initiated for ${
      employees.length
    } ${pluralizePhrase("employee", employees.length)}`;

    const toastId = toast.loading(loadingMessage);
    try {
      await multiplePayments({ employeeIds }).unwrap();
      const successMessage = `${employees.length} ${pluralizePhrase(
        "employee has",
        employees.length
      )} been paid`;
      toast.success(successMessage, { id: toastId });
    } catch (error: unknown) {
      const errorMessage = getRTKQueryErrorMessage(error);
      if (errorMessage) return toast.error(errorMessage, { id: toastId });

      toast.error("Failed to initiate salary payment", { id: toastId });
    }
    setSelectedEmployees([]);
    setIsMultiSelect(false);
  };

  const openPaymentConfirmation = (employee: IEmployee) => {
    openModal("confirmation-dialog", {
      title: "Confirm Payment",
      message: `Are you sure you want to pay ${employee.name} ${formatNaira(
        employee.salary
      )}?`,
      onConfirm: async () => handlePayEmployee(employee),
      type: "warning",
    });
  };

  const openMultiplePaymentsConfirmation = (employees: IEmployee[]) => {
    openModal("confirmation-dialog", {
      title: "Confirm Bulk Payment",
      message: `Are you sure you want to pay ${pluralizePhrase(
        "this employee",
        employees.length
      )}?`,
      onConfirm: async () => handlePayMultipleEmployees(employees),
      type: "warning",
    });
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp) => emp._id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Multi-select controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        {isMultiSelect && selectedEmployees.length > 0 && (
          <button
            onClick={() =>
              openMultiplePaymentsConfirmation(
                employees.filter((emp) => selectedEmployees.includes(emp._id))
              )
            }
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors order-2 sm:order-1"
          >
            <DollarSign className="w-4 h-4" />
            Pay Selected ({selectedEmployees.length})
          </button>
        )}
        <button
          onClick={() => {
            setIsMultiSelect(!isMultiSelect);
            setSelectedEmployees([]);
          }}
          className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors order-1 sm:order-2 ${
            isMultiSelect
              ? "bg-gray-600 hover:bg-gray-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {isMultiSelect ? "Cancel" : "Multi Select"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className={`p-4 ${
                  isMultiSelect ? "cursor-pointer hover:bg-gray-50" : ""
                }`}
                onClick={
                  isMultiSelect
                    ? () => toggleEmployeeSelection(employee._id)
                    : undefined
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isMultiSelect && (
                      <Checkbox
                        checked={selectedEmployees.includes(employee._id)}
                        onCheckedChange={() =>
                          toggleEmployeeSelection(employee._id)
                        }
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {employee.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatNaira(employee.salary)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last paid:{" "}
                      {employee.last_paid_on
                        ? formatDate(employee.last_paid_on)
                        : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEmployee(employee);
                    }}
                    className="flex-1 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPaymentConfirmation(employee);
                    }}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-4 h-4" />
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isMultiSelect && (
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedEmployees.length === employees.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr
                  key={employee._id}
                  className={`hover:bg-gray-50 ${
                    isMultiSelect ? "cursor-pointer" : ""
                  }`}
                  onClick={
                    isMultiSelect
                      ? () => toggleEmployeeSelection(employee._id)
                      : undefined
                  }
                >
                  {isMultiSelect && (
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedEmployees.includes(employee._id)}
                        onCheckedChange={() =>
                          toggleEmployeeSelection(employee._id)
                        }
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {employee.position}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatNaira(employee.salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {employee.last_paid_on
                        ? formatDate(employee.last_paid_on)
                        : "Never"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEmployee(employee);
                        }}
                        className="bg-transparent shadow-none p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPaymentConfirmation(employee);
                        }}
                        className="bg-green-100 shadow-none p-2 text-green-700 hover:text-green-800 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        Pay
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
