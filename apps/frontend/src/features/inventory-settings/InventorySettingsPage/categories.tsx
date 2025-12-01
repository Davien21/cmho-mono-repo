import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";

import { ActionPill } from "@/components/ActionPill";
import { useModalContext } from "@/contexts/modal-context";
import {
  useGetInventoryCategoriesQuery,
  useUpdateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
  IInventoryCategoryDto,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";

export const addCategorySchema = yup.object({
  name: yup.string().trim().required("Name is required"),
});

export type AddCategoryFormValues = yup.InferType<typeof addCategorySchema>;

export function CategoriesSection() {
  const { data, isLoading } = useGetInventoryCategoriesQuery();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateInventoryCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteInventoryCategoryMutation();
  const { openModal, closeModal } = useModalContext();

  const categories: IInventoryCategoryDto[] = data?.data || [];

  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    resolver: yupResolver(addCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const startEdit = (category: IInventoryCategoryDto) => {
    setEditingId(category._id);
    reset({
      name: category.name,
    });
  };

  const handleSaveEdit = async (values: AddCategoryFormValues) => {
    if (!editingId) return;
    try {
      await updateCategory({
        id: editingId,
        name: values.name.trim(),
      }).unwrap();
      toast.success("Category updated successfully");
      setEditingId(null);
      reset();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update category. Please try again.";
      toast.error(message);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {isLoading && (
          <div className="p-3 text-sm text-muted-foreground w-full">
            Loading categories...
          </div>
        )}
        {!isLoading && categories.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground flex flex-col gap-1 w-full">
            <span className="font-medium">No categories yet</span>
            <span>
              Create groups like &quot;Drugs&quot;, &quot;Lab supplies&quot; or
              &quot;Consumables&quot; to keep inventory organised.
            </span>
          </div>
        )}
        {categories.map((category) => {
          const isEditing = editingId === category._id;

          return isEditing ? (
            <form
              key={category._id}
              className="inline-flex items-center bg-muted rounded-full px-3 py-2 gap-2"
              onSubmit={handleSubmit(handleSaveEdit)}
            >
              <Input {...register("name")} className="h-8" />
              {errors.name?.message && (
                <span className="text-[10px] text-destructive ml-2">
                  {errors.name.message}
                </span>
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
              key={category._id}
              label={category.name}
              onEdit={() => startEdit(category)}
              onDelete={() => handleDelete(category._id, category.name)}
              isDeleting={isDeleting}
            />
          );
        })}
      </div>
    </div>
  );
}

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddCategoryFormValues) => Promise<void> | void;
  isSubmitting: boolean;
};

export function AddCategoryModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: AddCategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    resolver: yupResolver(addCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onCategoryFormSubmit = async (values: AddCategoryFormValues) => {
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
              Add category
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              Name this category to group related items.
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onCategoryFormSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label htmlFor="new-category-name">Name</Label>
              <Input
                id="new-category-name"
                placeholder="e.g. Drug"
                {...register("name")}
              />
              {errors.name?.message && (
                <p className="text-xs text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
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


