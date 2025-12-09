import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Reorder, useMotionValue, useDragControls } from "framer-motion";
import { useRaisedShadow } from "./use-raised-shadow";
import DragHandleIcon from "@/icons/DragHandleIcon";

import { ActionPill } from "@/components/ActionPill";
import { useModalContext } from "@/contexts/modal-context";
import {
  useGetInventoryUnitsQuery,
  useUpdateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
  useReorderInventoryUnitsMutation,
  IInventoryUnitDefinitionDto,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { cn } from "@/lib/utils";

export const addUnitSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  plural: yup.string().trim().required("Plural is required"),
});

export type AddUnitFormValues = yup.InferType<typeof addUnitSchema>;

type ReorderableUnitItemProps = {
  unit: IInventoryUnitDefinitionDto;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  disabled?: boolean;
};

function ReorderableUnitItem({
  unit,
  onEdit,
  onDelete,
  isDeleting,
  disabled = false,
}: ReorderableUnitItemProps) {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={unit}
      id={unit._id}
      style={{
        y,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      layout
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg mb-2 select-none",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 text-muted-foreground",
          !disabled && "cursor-grab active:cursor-grabbing"
        )}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (!disabled) {
            e.preventDefault();
            dragControls.start(e);
          }
        }}
        onTouchStart={(e) => {
          if (!disabled) {
            e.preventDefault();
          }
        }}
        onTouchMove={(e) => {
          if (!disabled) {
            e.preventDefault();
          }
        }}
      >
        <DragHandleIcon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <ActionPill
          label={unit.name}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
          style={{ boxShadow }}
        />
      </div>
    </Reorder.Item>
  );
}

type UnitsSectionProps = {
  onSaveButtonChange?: (props: {
    hasPendingChanges: boolean;
    onSave: () => void;
    onUndo: () => void;
    isSaving: boolean;
  }) => void;
};

export function UnitsSection({ onSaveButtonChange }: UnitsSectionProps = {}) {
  const { data, isLoading } = useGetInventoryUnitsQuery();
  const [, { isLoading: isUpdating }] = useUpdateInventoryUnitMutation();
  const [deleteUnit, { isLoading: isDeleting }] =
    useDeleteInventoryUnitMutation();
  const [reorderUnits, { isLoading: isReordering }] =
    useReorderInventoryUnitsMutation();
  const { openModal, closeModal } = useModalContext();

  // Sort units by order (ascending), then by createdAt as fallback
  const originalUnits: IInventoryUnitDefinitionDto[] = useMemo(() => {
    const allUnits = data?.data || [];
    return [...allUnits].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Fallback to createdAt if order is the same
      return 0;
    });
  }, [data?.data]);

  // Track the current display order (may differ from original if reordered)
  const [displayUnits, setDisplayUnits] = useState<
    IInventoryUnitDefinitionDto[]
  >([]);
  const [pendingOrders, setPendingOrders] = useState<Array<{
    id: string;
    order: number;
  }> | null>(null);
  const isDraggingRef = useRef(false);

  // Update display units when original units change (but not during drag)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setDisplayUnits(originalUnits);
      setPendingOrders(null); // Reset pending orders when data refreshes
    }
  }, [originalUnits]);

  // Check if there are pending changes
  const hasPendingChanges = pendingOrders !== null;

  const units = displayUnits;

  const [editingUnit, setEditingUnit] =
    useState<IInventoryUnitDefinitionDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const startEdit = (unit: IInventoryUnitDefinitionDto) => {
    setEditingUnit(unit);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingUnit(null);
    setIsEditModalOpen(false);
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
          const message = getRTKQueryErrorMessage(
            error,
            "Failed to delete unit. Please try again."
          );
          toast.error(message);
        } finally {
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  const handleReorder = useCallback(
    (newOrder: IInventoryUnitDefinitionDto[]) => {
      // Prevent reordering while a reorder operation is in progress
      if (isReordering) {
        return;
      }

      isDraggingRef.current = true;

      // Update state directly - framer-motion handles the animations
      setDisplayUnits(newOrder);

      // Calculate new orders based on the reordered array
      const newOrders = newOrder.map((unit, idx) => ({
        id: unit._id,
        order: idx,
      }));

      setPendingOrders(newOrders);

      // Reset dragging state after animation completes
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 300);
    },
    [isReordering]
  );

  const handleSaveOrder = useCallback(async () => {
    if (!pendingOrders) {
      return;
    }

    try {
      await reorderUnits({ unitOrders: pendingOrders }).unwrap();
      toast.success("Units reordered successfully");
      setPendingOrders(null);
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to reorder units. Please try again."
      );
      toast.error(message);
    }
  }, [pendingOrders, reorderUnits]);

  const handleUndo = useCallback(() => {
    // Reset display units back to original order
    setDisplayUnits(originalUnits);
    setPendingOrders(null);
  }, [originalUnits]);

  // Notify parent component about save button state
  useEffect(() => {
    if (onSaveButtonChange) {
      onSaveButtonChange({
        hasPendingChanges,
        onSave: handleSaveOrder,
        onUndo: handleUndo,
        isSaving: isReordering,
      });
    }
  }, [
    hasPendingChanges,
    isReordering,
    handleSaveOrder,
    handleUndo,
    onSaveButtonChange,
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {isLoading && (
          <div className="p-3 text-base sm:text-sm text-muted-foreground w-full">
            Loading units...
          </div>
        )}
        {!isLoading && units.length === 0 && (
          <div className="p-4 text-base sm:text-sm text-muted-foreground flex flex-col gap-1 w-full">
            <span className="font-medium">No units yet</span>
            <span>
              Start by adding the smallest thing you count (e.g. tablet, ml).
            </span>
          </div>
        )}
        {!isLoading && units.length > 0 && (
          <Reorder.Group axis="y" onReorder={handleReorder} values={units}>
            {units.map((unit) => (
              <ReorderableUnitItem
                key={unit._id}
                unit={unit}
                onEdit={() => startEdit(unit)}
                onDelete={() => handleDelete(unit._id, unit.name)}
                isDeleting={isDeleting}
                disabled={isReordering}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {editingUnit && (
        <EditUnitModal
          open={isEditModalOpen}
          onClose={handleCloseEdit}
          unit={editingUnit}
          isSubmitting={isUpdating}
        />
      )}
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
              <Label htmlFor="new-unit-name" className="text-base sm:text-sm">
                Name
              </Label>
              <Input
                id="new-unit-name"
                placeholder="e.g. Pack"
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
              <Label htmlFor="new-unit-plural" className="text-base sm:text-sm">
                Plural
              </Label>
              <Input
                id="new-unit-plural"
                placeholder="e.g. Packs"
                {...register("plural")}
                className="text-base sm:text-sm h-11 sm:h-9"
              />
              {errors.plural?.message && (
                <p className="text-sm sm:text-xs text-destructive mt-1">
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

type EditUnitModalProps = {
  open: boolean;
  onClose: () => void;
  unit: IInventoryUnitDefinitionDto;
  isSubmitting: boolean;
};

export function EditUnitModal({
  open,
  onClose,
  unit,
  isSubmitting,
}: EditUnitModalProps) {
  const [updateUnit] = useUpdateInventoryUnitMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUnitFormValues>({
    resolver: yupResolver(addUnitSchema),
    defaultValues: {
      name: unit.name,
      plural: unit.plural,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onUnitFormSubmit = async (values: AddUnitFormValues) => {
    try {
      await updateUnit({
        id: unit._id,
        name: values.name.trim(),
        plural: values.plural.trim(),
      }).unwrap();
      toast.success("Unit updated successfully");
      handleClose();
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to update unit. Please try again."
      );
      toast.error(message);
    }
  };

  // Reset form when modal opens with unit data
  useEffect(() => {
    if (open) {
      reset({
        name: unit.name,
        plural: unit.plural,
      });
    }
  }, [open, unit, reset]);

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
              Edit unit
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              Update the singular and plural forms for this unit.
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onUnitFormSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label htmlFor="edit-unit-name" className="text-base sm:text-sm">
                Name
              </Label>
              <Input
                id="edit-unit-name"
                placeholder="e.g. Pack"
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
              <Label
                htmlFor="edit-unit-plural"
                className="text-base sm:text-sm"
              >
                Plural
              </Label>
              <Input
                id="edit-unit-plural"
                placeholder="e.g. Packs"
                {...register("plural")}
                className="text-base sm:text-sm h-11 sm:h-9"
              />
              {errors.plural?.message && (
                <p className="text-sm sm:text-xs text-destructive mt-1">
                  {errors.plural.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update unit"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
