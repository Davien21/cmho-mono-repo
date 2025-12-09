import { useState } from "react";
import { Edit2, ShieldOff, Crown } from "lucide-react";
import { IAdmin } from "../../types";
import { useModalContext } from "@/contexts/modal-context";
import { Badge } from "@/components/ui/badge";
import { BorderedOptions } from "@/components/BorderedOptions";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface AdminsTableProps {
  admins: IAdmin[];
}

export function AdminsTable({ admins }: AdminsTableProps) {
  const { openModal } = useModalContext();

  const handleEditAdmin = (admin: IAdmin) => {
    openModal("edit-admin", admin);
  };

  const handleDisableAdmin = (admin: IAdmin) => {
    openModal("confirmation-dialog", {
      type: "warning",
      title: "Disable Admin",
      message: `Are you sure you want to disable ${admin.name}? They will not be able to access the system.`,
      onConfirm: () => {
        openModal("disable-admin", admin);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            {status}
          </Badge>
        );
    }
  };

  const formatRoles = (roles: string[]) => {
    if (!roles || roles.length === 0) return "No roles";
    return roles.join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <div key={admin._id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{admin.name}</h3>
                      {admin.isSuperAdmin && (
                        <Crown className="h-4 w-4 text-yellow-500" title="Super Admin" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{admin.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getStatusBadge(admin.status)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Roles: {formatRoles(admin.roles)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <BorderedOptions>
                      <DropdownMenuItem onClick={() => handleEditAdmin(admin)} className="text-base sm:text-sm py-2.5 sm:py-2">
                        <Edit2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                        Edit
                      </DropdownMenuItem>
                      {admin.status === "active" && (
                        <DropdownMenuItem
                          onClick={() => handleDisableAdmin(admin)}
                          className="text-red-600 focus:text-red-600 text-base sm:text-sm py-2.5 sm:py-2"
                        >
                          <ShieldOff className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                          Disable
                        </DropdownMenuItem>
                      )}
                    </BorderedOptions>
                  </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.name}
                      </div>
                      {admin.isSuperAdmin && (
                        <Crown className="h-4 w-4 text-yellow-500" title="Super Admin" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatRoles(admin.roles)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(admin.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end">
                      <BorderedOptions>
                        <DropdownMenuItem onClick={() => handleEditAdmin(admin)} className="text-base sm:text-sm py-2.5 sm:py-2">
                          <Edit2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                          Edit
                        </DropdownMenuItem>
                        {admin.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => handleDisableAdmin(admin)}
                            className="text-red-600 focus:text-red-600 text-base sm:text-sm py-2.5 sm:py-2"
                          >
                            <ShieldOff className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                            Disable
                          </DropdownMenuItem>
                        )}
                      </BorderedOptions>
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

