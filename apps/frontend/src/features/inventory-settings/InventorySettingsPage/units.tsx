import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";

import { ActionPill } from "@/components/ActionPill";
import { useModalContext } from "@/contexts/modal-context";
import {
  useGetInventoryUnitsQuery,
  useUpdateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
  IInventoryUnitDefinitionDto,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";

export const addUnitSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  plural: yup.string().trim().required("Plural is required"),
});

export type AddUnitFormValues = yup.InferType<typeof addUnitSchema>;

export function UnitsSection() {
  const { data, isLoading } = useGetInventoryUnitsQuery();
  const [updateUnit, { isLoading: isUpdating }] =
    useUpdateInventoryUnitMutation();
  const [deleteUnit, { isLoading: isDeleting }] =
    useDeleteInventoryUnitMutation();
  const { openModal, closeModal } = useModalContext();

  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUnitFormValues>({
    resolver: yupResolver(addUnitSchema),
    defaultValues: {
      name: "",
      plural: "",
    },
  });

  const units: IInventoryUnitDefinitionDto[] = data?.data || [];

  const startEdit = (unit: IInventoryUnitDefinitionDto) => {
    setEditingId(unit._id);
    reset({
      name: unit.name,
      plural: unit.plural,
    });
  };

  const handleSaveEdit = async (values: AddUnitFormValues) => {
    if (!editingId) return;
    try {
      await updateUnit({
        id: editingId,
        name: values.name.trim(),
        plural: values.plural.trim(),
      }).unwrap();
      toast.success("Unit updated successfully");
      setEditingId(null);
      reset();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update unit. Please try again.";
      toast.error(message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    openModal("confirmation-dialog", {
      title: "Delete unit",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteUnit(id).unwrap();
          toast.success("Unit deleted successfully");
        } catch (error: unknown) {
          const message =
            getRTKQueryErrorMessage(error) ||
            "Failed to delete unit. Please try again.";
          toast.error(message);
        } finally {
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {isLoading && (
          <div className="p-3 text-sm text-muted-foreground w-full">
            Loading units...
          </div>
        )}
        {!isLoading && units.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground flex flex-col gap-1 w-full">
            <span className="font-medium">No units yet</span>
            <span>
              Start by adding the smallest thing you count (e.g. tablet, ml).
            </span>
          </div>
        )}
        {units.map((unit) => {
          const isEditing = editingId === unit._id;
          return isEditing ? (
            <form
              key={unit._id}
              className="inline-flex items-center bg-muted rounded-full px-3 py-2 gap-2"
              onSubmit={handleSubmit(handleSaveEdit)}
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  aria-label="Unit name"
                  {...register("name")}
                  className="h-8"
                />
                <Input
                  aria-label="Unit plural"
                  {...register("plural")}
                  className="h-8"
                />
              </div>
              {(errors.name?.message || errors.plural?.message) && (
                <div className="flex flex-col text-[10px] text-destructive ml-2">
                  {errors.name?.message && <span>{errors.name.message}</span>}
                  {errors.plural?.message && (
                    <span>{errors.plural.message}</span>
                  )}
                </div>
              )}
              <div className="flex gap-1 ml-2">
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  className="h-8 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    reset();
                  }}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <ActionPill
              key={unit._id}
              label={unit.name}
              onEdit={() => startEdit(unit)}
              onDelete={() => handleDelete(unit._id, unit.name)}
              isDeleting={isDeleting}
            />
          );
        })}
      </div>
    </div>
  );
}

type AddUnitModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddUnitFormValues) => Promise<void> | void;
  isSubmitting: boolean;
};

export function AddUnitModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: AddUnitModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUnitFormValues>({
    resolver: yupResolver(addUnitSchema),
    defaultValues: {
      name: "",
      plural: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onUnitFormSubmit = async (values: AddUnitFormValues) => {
    await onSubmit(values);
    reset();
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
              Add unit
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              Define the singular and plural forms for this unit.
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onUnitFormSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label htmlFor="new-unit-name">Name</Label>
              <Input
                id="new-unit-name"
                placeholder="e.g. Pack"
                {...register("name")}
              />
              {errors.name?.message && (
                <p className="text-xs text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-unit-plural">Plural</Label>
              <Input
                id="new-unit-plural"
                placeholder="e.g. Packs"
                {...register("plural")}
              />
              {errors.plural?.message && (
                <p className="text-xs text-destructive mt-1">
                  {errors.plural.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add unit"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
