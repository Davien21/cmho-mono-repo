import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";

import { useModalContext } from "@/contexts/modal-context";
import {
  useGetSuppliersQuery,
  useDeleteSupplierMutation,
  ISupplierDto,
  SupplierStatus,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { BorderedOptions } from "@/components/BorderedOptions";
import { Edit2, Loader2, Trash2, Truck } from "lucide-react";

export const supplierSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  phone: yup.string().trim().optional(),
  address: yup.string().trim().optional(),
  status: yup
    .mixed<SupplierStatus>()
    .oneOf(["active", "disabled"])
    .default("active"),
});

export type SupplierFormValues = yup.InferType<typeof supplierSchema>;

type SuppliersSectionProps = {
  onEditSupplier: (supplier: ISupplierDto | null) => void;
};

export function SuppliersSection({ onEditSupplier }: SuppliersSectionProps) {
  const { data, isLoading } = useGetSuppliersQuery();
  const [deleteSupplier, { isLoading: isDeleting }] =
    useDeleteSupplierMutation();
  const { openModal, closeModal } = useModalContext();

  const suppliers: ISupplierDto[] = data?.data || [];

  const handleDelete = (supplier: ISupplierDto) => {
    openModal("confirmation-dialog", {
      title: "Delete supplier",
      message: `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteSupplier(supplier._id).unwrap();
          toast.success("Supplier deleted successfully");
        } catch (error: unknown) {
          const message = getRTKQueryErrorMessage(
            error,
            "Failed to delete supplier. Please try again."
          );
          toast.error(message);
        } finally {
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  if (isLoading) return <LoadingState />;

  if (!isLoading && suppliers.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {supplier.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {supplier.contact?.phone || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs">
                  <span className="line-clamp-2">
                    {supplier.contact?.address || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <Badge
                    className={
                      supplier.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200 capitalize"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 capitalize"
                    }
                  >
                    {supplier.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end">
                    <BorderedOptions>
                      <DropdownMenuItem
                        onClick={() => onEditSupplier(supplier)}
                        className="text-base sm:text-sm py-2.5 sm:py-2"
                      >
                        <Edit2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                        Edit supplier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(supplier)}
                        className="text-red-600 focus:text-red-600 text-base sm:text-sm py-2.5 sm:py-2"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                        Delete supplier
                      </DropdownMenuItem>
                    </BorderedOptions>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked view */}
      <div className="space-y-3 sm:hidden">
        {suppliers.map((supplier) => (
          <div
            key={supplier._id}
            className="border rounded-lg p-3 bg-white flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm text-gray-900">
                  {supplier.name}
                </p>
                <p className="text-xs text-gray-600">
                  {supplier.contact?.phone || "No phone"}
                </p>
                {supplier.contact?.address && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {supplier.contact.address}
                  </p>
                )}
              </div>
              <Badge
                className={
                  supplier.status === "active"
                    ? "bg-green-100 text-green-800 hover:bg-green-200 capitalize"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 capitalize"
                }
              >
                {supplier.status}
              </Badge>
            </div>
            <div className="flex justify-end">
              <BorderedOptions>
                <DropdownMenuItem onClick={() => onEditSupplier(supplier)} className="text-base sm:text-sm py-2.5 sm:py-2">
                  <Edit2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                  Edit supplier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(supplier)}
                  className="text-red-600 focus:text-red-600 text-base sm:text-sm py-2.5 sm:py-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                  Delete supplier
                </DropdownMenuItem>
              </BorderedOptions>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type SupplierModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  mode: "create" | "edit";
  initialSupplier?: ISupplierDto | null;
};

export function SupplierModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  mode,
  initialSupplier,
}: SupplierModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: yupResolver(supplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialSupplier) {
        reset({
          name: initialSupplier.name,
          phone: initialSupplier.contact?.phone || "",
          address: initialSupplier.contact?.address || "",
          status:
            initialSupplier.status === "deleted"
              ? "disabled"
              : initialSupplier.status,
        });
      } else {
        reset({
          name: "",
          phone: "",
          address: "",
          status: "active",
        });
      }
    }
  }, [open, initialSupplier, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = async (values: SupplierFormValues) => {
    await onSubmit(values);
  };

  return (
    <ResponsiveDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-md w-full">
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-lg font-semibold">
              {mode === "create" ? "Add supplier" : "Edit supplier"}
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              {mode === "create"
                ? "Add a new supplier with their contact details."
                : "Update this supplier's details."}
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="supplier-name" className="text-base sm:text-sm">Name</Label>
                <Input
                  id="supplier-name"
                  placeholder="e.g. ABC Pharmaceuticals"
                  {...register("name")}
                  className="text-base sm:text-sm h-11 sm:h-9"
                />
                {errors.name?.message && (
                  <p className="text-sm sm:text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="supplier-phone" className="text-base sm:text-sm">Phone</Label>
                <Input
                  id="supplier-phone"
                  placeholder="e.g. 0803 000 0000"
                  {...register("phone")}
                  className="text-base sm:text-sm h-11 sm:h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplier-address" className="text-base sm:text-sm">Address</Label>
              <Input
                id="supplier-address"
                placeholder="e.g. 12 Main Street, Lagos"
                {...register("address")}
                className="text-base sm:text-sm h-11 sm:h-9"
              />
            </div>

            {mode === "edit" && (
              <div className="space-y-1">
                <Label htmlFor="supplier-status" className="text-base sm:text-sm">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as SupplierStatus)
                      }
                    >
                      <SelectTrigger id="supplier-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "create"
                    ? "Adding..."
                    : "Saving..."
                  : mode === "create"
                  ? "Add supplier"
                  : "Save changes"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}

const EmptyState = () => {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-dashed border-muted/40 p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="inline-flex h-16 w-16 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/5 text-primary">
          <Truck className="h-8 w-8 sm:h-6 sm:w-6" />
        </div>
        <h3 className="text-lg sm:text-lg font-semibold text-foreground">
          No suppliers yet
        </h3>
        <p className="text-base sm:text-sm text-muted-foreground max-w-md">
          Keep track of who you buy from by adding your first supplier. You will
          be able to reference suppliers when creating stock entries.
        </p>
        <p className="text-sm sm:text-xs text-muted-foreground">
          Use the <span className="font-medium">Add supplier</span> button above
          to get started.
        </p>
      </div>
    </div>
  );
};

const LoadingState = () => {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-dashed border-muted/40 p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="inline-flex h-16 w-16 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/5 text-primary animate-spin">
          <Loader2 className="h-8 w-8 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
};
