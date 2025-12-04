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
  useGetInventoryCategoriesQuery,
  useUpdateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
  useReorderInventoryCategoriesMutation,
  useGetInventoryUnitsQuery,
  IInventoryCategoryDto,
  IInventoryUnitDefinitionDto,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { UnitGroupingBuilder } from "@/components/UnitGroupingBuilder";
import { UnitLevel } from "@/types/inventory";
import { cn } from "@/lib/utils";

export const addCategorySchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  canBeSold: yup.boolean().optional(),
});

export type AddCategoryFormValues = yup.InferType<typeof addCategorySchema>;

type ReorderableCategoryItemProps = {
  category: IInventoryCategoryDto;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  disabled?: boolean;
};

function ReorderableCategoryItem({
  category,
  onEdit,
  onDelete,
  isDeleting,
  disabled = false,
}: ReorderableCategoryItemProps) {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={category}
      id={category._id}
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
          label={category.name}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
          style={{ boxShadow }}
        />
      </div>
    </Reorder.Item>
  );
}

type CategoriesSectionProps = {
  onSaveButtonChange?: (props: {
    hasPendingChanges: boolean;
    onSave: () => void;
    onUndo: () => void;
    isSaving: boolean;
  }) => void;
};

export function CategoriesSection({
  onSaveButtonChange,
}: CategoriesSectionProps = {}) {
  const { data, isLoading } = useGetInventoryCategoriesQuery();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateInventoryCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteInventoryCategoryMutation();
  const [reorderCategories, { isLoading: isReordering }] =
    useReorderInventoryCategoriesMutation();
  const { openModal, closeModal } = useModalContext();

  // Sort categories by order (ascending), then by createdAt as fallback
  const originalCategories: IInventoryCategoryDto[] = useMemo(() => {
    const allCategories = data?.data || [];
    return [...allCategories].sort((a, b) => {
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
  const [displayCategories, setDisplayCategories] = useState<
    IInventoryCategoryDto[]
  >([]);
  const [pendingOrders, setPendingOrders] = useState<Array<{
    id: string;
    order: number;
  }> | null>(null);
  const isDraggingRef = useRef(false);

  // Update display categories when original categories change (but not during drag)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setDisplayCategories(originalCategories);
      setPendingOrders(null); // Reset pending orders when data refreshes
    }
  }, [originalCategories]);

  // Check if there are pending changes
  const hasPendingChanges = pendingOrders !== null;

  const categories = displayCategories;

  const [editingCategory, setEditingCategory] =
    useState<IInventoryCategoryDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const startEdit = (category: IInventoryCategoryDto) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingCategory(null);
    setIsEditModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    openModal("confirmation-dialog", {
      title: "Delete category",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteCategory(id).unwrap();
          toast.success("Category deleted successfully");
        } catch (error: unknown) {
          const message =
            getRTKQueryErrorMessage(error) ||
            "Failed to delete category. Please try again.";
          toast.error(message);
        } finally {
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  const handleReorder = useCallback(
    (newOrder: IInventoryCategoryDto[]) => {
      // Prevent reordering while a reorder operation is in progress
      if (isReordering) {
        return;
      }

      isDraggingRef.current = true;

      // Update state directly - framer-motion handles the animations
      setDisplayCategories(newOrder);

      // Calculate new orders based on the reordered array
      const newOrders = newOrder.map((category, idx) => ({
        id: category._id,
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
      await reorderCategories({ categoryOrders: pendingOrders }).unwrap();
      toast.success("Categories reordered successfully");
      setPendingOrders(null);
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to reorder categories. Please try again.";
      toast.error(message);
    }
  }, [pendingOrders, reorderCategories]);

  const handleUndo = useCallback(() => {
    // Reset display categories back to original order
    setDisplayCategories(originalCategories);
    setPendingOrders(null);
  }, [originalCategories]);

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
            Loading categories...
          </div>
        )}
        {!isLoading && categories.length === 0 && (
          <div className="p-4 text-base sm:text-sm text-muted-foreground flex flex-col gap-1 w-full">
            <span className="font-medium">No categories yet</span>
            <span>
              Create groups like &quot;Drugs&quot;, &quot;Lab supplies&quot; or
              &quot;Consumables&quot; to keep inventory organised.
            </span>
          </div>
        )}
        {!isLoading && categories.length > 0 && (
          <Reorder.Group axis="y" onReorder={handleReorder} values={categories}>
            {categories.map((category) => (
              <ReorderableCategoryItem
                key={category._id}
                category={category}
                onEdit={() => startEdit(category)}
                onDelete={() => handleDelete(category._id, category.name)}
                isDeleting={isDeleting}
                disabled={isReordering}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {editingCategory && (
        <EditCategoryModal
          open={isEditModalOpen}
          onClose={handleCloseEdit}
          category={editingCategory}
          isSubmitting={isUpdating}
        />
      )}
    </div>
  );
}

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    values: AddCategoryFormValues & { unitPresetIds?: string[] }
  ) => Promise<void> | void;
  isSubmitting: boolean;
};

export function AddCategoryModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: AddCategoryModalProps) {
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const unitsPresets: IInventoryUnitDefinitionDto[] = unitsResponse?.data || [];

  const [units, setUnits] = useState<UnitLevel[]>([]);
  const [initialUnits, setInitialUnits] = useState<UnitLevel[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    resolver: yupResolver(addCategorySchema),
    defaultValues: {
      name: "",
      canBeSold: true,
    },
  });

  const canBeSold = watch("canBeSold");

  useEffect(() => {
    if (!open) {
      setUnits([]);
      setInitialUnits([]);
      reset();
    }
  }, [open, reset]);

  const handleClose = () => {
    setUnits([]);
    setInitialUnits([]);
    reset();
    onClose();
  };

  const onCategoryFormSubmit = async (values: AddCategoryFormValues) => {
    // Convert UnitLevel[] to unitPresetIds (extract id from each unit)
    const unitPresetIds = units.length > 0 ? units.map((u) => u.id) : undefined;
    await onSubmit({ ...values, unitPresetIds });
    setUnits([]);
    setInitialUnits([]);
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
        <ResponsiveDialog.Content className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-lg font-semibold">
              Add category
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              Name this category and optionally set up a preset packaging unit
              structure.
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onCategoryFormSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label
                htmlFor="new-category-name"
                className="text-base sm:text-sm"
              >
                Name
              </Label>
              <Input
                id="new-category-name"
                placeholder="e.g. Drug"
                {...register("name")}
                className="text-base sm:text-sm h-11 sm:h-9"
              />
              {errors.name?.message && (
                <p className="text-sm sm:text-xs text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3 mt-4">
              <UnitGroupingBuilder
                units={units}
                onChange={setUnits}
                initialUnits={initialUnits}
                presets={unitsPresets}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add category"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}

type EditCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  category: IInventoryCategoryDto;
  isSubmitting: boolean;
};

export function EditCategoryModal({
  open,
  onClose,
  category,
  isSubmitting,
}: EditCategoryModalProps) {
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const unitsPresets: IInventoryUnitDefinitionDto[] = unitsResponse?.data || [];
  const [updateCategory] = useUpdateInventoryCategoryMutation();

  // Convert category's unitPresetIds to UnitLevel[]
  const getInitialUnits = useMemo((): UnitLevel[] => {
    // Prefer populated unit presets if available
    if (category.unitPresets && category.unitPresets.length > 0) {
      return category.unitPresets.map((u, index) => ({
        id: u._id,
        name: u.name,
        plural: u.plural,
        quantity: index === 0 ? 1 : undefined,
      }));
    }

    // Fallback to unitPresetIds + unitsPresets list
    if (!category.unitPresetIds || !category.unitPresetIds.length) {
      return [];
    }

    const presetUnits = category.unitPresetIds
      .map((id) => unitsPresets.find((u) => u._id === id))
      .filter((u): u is IInventoryUnitDefinitionDto => Boolean(u));

    return presetUnits.map((u, index) => ({
      id: u._id,
      name: u.name,
      plural: u.plural,
      quantity: index === 0 ? 1 : undefined,
    }));
  }, [category, unitsPresets]);

  const [units, setUnits] = useState<UnitLevel[]>([]);
  const [initialUnits, setInitialUnits] = useState<UnitLevel[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    resolver: yupResolver(addCategorySchema),
    defaultValues: {
      name: category.name,
      canBeSold: category.canBeSold ?? true,
    },
  });

  const canBeSold = watch("canBeSold");

  useEffect(() => {
    if (open) {
      const initial = getInitialUnits;
      setUnits(initial);
      setInitialUnits(initial);
      reset({
        name: category.name,
        canBeSold: category.canBeSold ?? true,
      });
    } else {
      // Reset when modal closes
      setUnits([]);
      setInitialUnits([]);
    }
  }, [open, category, getInitialUnits, reset]);

  const handleClose = () => {
    const initial = getInitialUnits;
    setUnits(initial);
    setInitialUnits(initial);
    reset();
    onClose();
  };

  const onCategoryFormSubmit = async (values: AddCategoryFormValues) => {
    try {
      // Convert UnitLevel[] to unitPresetIds (extract id from each unit)
      const unitPresetIds =
        units.length > 0 ? units.map((u) => u.id) : undefined;
      await updateCategory({
        id: category._id,
        name: values.name.trim(),
        unitPresetIds,
        canBeSold: values.canBeSold,
      }).unwrap();
      toast.success("Category updated successfully");
      handleClose();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update category. Please try again.";
      toast.error(message);
    }
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
        <ResponsiveDialog.Content className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-lg font-semibold">
              Edit category
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              Update the category name and packaging unit structure.
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onCategoryFormSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label
                htmlFor="edit-category-name"
                className="text-base sm:text-sm"
              >
                Name
              </Label>
              <Input
                id="edit-category-name"
                placeholder="e.g. Drug"
                {...register("name")}
                className="text-base sm:text-sm h-11 sm:h-9"
              />
              {errors.name?.message && (
                <p className="text-sm sm:text-xs text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3 mt-4">
              <UnitGroupingBuilder
                units={units}
                onChange={setUnits}
                initialUnits={initialUnits}
                presets={unitsPresets}
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="edit-can-be-sold"
                checked={canBeSold}
                onCheckedChange={(checked) => {
                  reset({ ...watch(), canBeSold: checked === true });
                }}
              />
              <Label
                htmlFor="edit-can-be-sold"
                className="text-sm font-normal cursor-pointer"
              >
                Click to mark this as an item that can be sold
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update category"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
