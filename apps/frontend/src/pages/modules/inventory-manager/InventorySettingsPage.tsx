import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { ActionPill } from "@/components/ActionPill";
import { useModalContext } from "@/contexts/modal-context";
import SegmentedControl from "@/SegmentedControl";
import {
  useGetInventoryUnitsQuery,
  useCreateInventoryUnitMutation,
  useUpdateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
  useGetInventoryCategoriesQuery,
  useCreateInventoryCategoryMutation,
  useUpdateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  IInventoryUnitDefinitionDto,
  IInventoryCategoryDto,
  ISupplierDto,
  SupplierStatus,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Tags, Truck, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const addUnitSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  plural: yup.string().trim().required("Plural is required"),
});

type AddUnitFormValues = yup.InferType<typeof addUnitSchema>;

const addCategorySchema = yup.object({
  name: yup.string().trim().required("Name is required"),
});
type AddCategoryFormValues = yup.InferType<typeof addCategorySchema>;

const supplierSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  phone: yup.string().trim().optional(),
  address: yup.string().trim().optional(),
  status: yup
    .mixed<SupplierStatus>()
    .oneOf(["active", "disabled"])
    .default("active"),
});

type SupplierFormValues = yup.InferType<typeof supplierSchema>;

function UnitsSection() {
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

function CategoriesSection() {
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

export default function InventorySettingsPage() {
  const { data: unitsSummary } = useGetInventoryUnitsQuery();
  const { data: categoriesSummary } = useGetInventoryCategoriesQuery();
  const { data: suppliersSummary } = useGetSuppliersQuery();
  const [createUnit, { isLoading: isCreatingUnit }] =
    useCreateInventoryUnitMutation();
  const [createCategory, { isLoading: isCreatingCategory }] =
    useCreateInventoryCategoryMutation();
  const [createSupplier, { isLoading: isCreatingSupplier }] =
    useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdatingSupplier }] =
    useUpdateSupplierMutation();

  const unitsCount = unitsSummary?.data?.length ?? 0;
  const categoriesCount = categoriesSummary?.data?.length ?? 0;
  const suppliersCount = suppliersSummary?.data?.length ?? 0;

  const [activeSection, setActiveSection] = useState<
    "Units" | "Categories" | "Suppliers"
  >("Units");

  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplierDto | null>(
    null
  );

  const handleCloseAddUnit = () => {
    setIsAddUnitOpen(false);
  };

  const handleCreateUnit = async (values: AddUnitFormValues) => {
    try {
      await createUnit({
        name: values.name.trim(),
        plural: values.plural.trim(),
      }).unwrap();
      toast.success("Unit added successfully");
      handleCloseAddUnit();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to add unit. Please try again.";
      toast.error(message);
    }
  };

  const handleCloseAddCategory = () => {
    setIsAddCategoryOpen(false);
  };

  const handleCreateCategory = async (values: AddCategoryFormValues) => {
    try {
      await createCategory({
        name: values.name.trim(),
      }).unwrap();
      toast.success("Category added successfully");
      handleCloseAddCategory();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to add category. Please try again.";
      toast.error(message);
    }
  };

  const handleCloseAddSupplier = () => {
    setIsAddSupplierOpen(false);
  };

  const handleCreateSupplier = async (values: SupplierFormValues) => {
    try {
      await createSupplier({
        name: values.name.trim(),
        contact:
          values.phone || values.address
            ? {
                phone: values.phone?.trim() || undefined,
                address: values.address?.trim() || undefined,
              }
            : undefined,
        status: (values.status ?? "active") as SupplierStatus,
      }).unwrap();
      toast.success("Supplier added successfully");
      handleCloseAddSupplier();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to add supplier. Please try again.";
      toast.error(message);
    }
  };

  const handleCloseEditSupplier = () => {
    setEditingSupplier(null);
  };

  const handleUpdateSupplierSubmit = async (values: SupplierFormValues) => {
    if (!editingSupplier) return;
    try {
      await updateSupplier({
        id: editingSupplier._id,
        name: values.name.trim(),
        contact:
          values.phone || values.address
            ? {
                phone: values.phone?.trim() || undefined,
                address: values.address?.trim() || undefined,
              }
            : undefined,
        status: (values.status ?? "active") as SupplierStatus,
      }).unwrap();
      toast.success("Supplier updated successfully");
      handleCloseEditSupplier();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update supplier. Please try again.";
      toast.error(message);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Inventory settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure settings that are used across your inventory.
          </p>
        </div>

        {/* Main content layout */}
        <div className="space-y-4">
          <div className="flex justify-start">
            <SegmentedControl
              value={activeSection}
              onChange={(value) =>
                setActiveSection(
                  value === "Categories"
                    ? "Categories"
                    : value === "Suppliers"
                    ? "Suppliers"
                    : "Units"
                )
              }
              options={[
                {
                  id: "Units",
                  content: (
                    <div className="flex items-center gap-2">
                      <span>Units</span>
                      <Badge className="text-[11px] font-medium px-2 py-0 h-5 rounded-full bg-slate-100 text-slate-700">
                        {unitsCount}
                      </Badge>
                    </div>
                  ),
                },
                {
                  id: "Categories",
                  content: (
                    <div className="flex items-center gap-2">
                      <span>Categories</span>
                      <Badge className="text-[11px] font-medium px-2 py-0 h-5 rounded-full bg-slate-100 text-slate-700">
                        {categoriesCount}
                      </Badge>
                    </div>
                  ),
                },
                {
                  id: "Suppliers",
                  content: (
                    <div className="flex items-center gap-2">
                      <span>Suppliers</span>
                      <Badge className="text-[11px] font-medium px-2 py-0 h-5 rounded-full bg-slate-100 text-slate-700">
                        {suppliersCount}
                      </Badge>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Card
            id="inventory-units-section"
            variant="plain"
            className={activeSection === "Units" ? "" : "hidden"}
          >
            <CardHeader className="pb-3 border-b bg-muted/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Inventory Units
                  </CardTitle>
                  <CardDescription>
                    Start with the base units you stock and sell with.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="mt-1 sm:mt-0"
                  onClick={() => setIsAddUnitOpen(true)}
                >
                  Add unit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <UnitsSection />
            </CardContent>
          </Card>

          <AddUnitModal
            open={isAddUnitOpen}
            onClose={handleCloseAddUnit}
            onSubmit={handleCreateUnit}
            isSubmitting={isCreatingUnit}
          />

          <Card
            id="inventory-categories-section"
            variant="plain"
            className={activeSection === "Categories" ? "" : "hidden"}
          >
            <CardHeader className="pb-3 border-b bg-muted/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Tags className="h-4 w-4 text-primary" />
                    Inventory Categories
                  </CardTitle>
                  <CardDescription>
                    Group items so they&apos;re easier to browse and report on.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="mt-1 sm:mt-0"
                  onClick={() => setIsAddCategoryOpen(true)}
                >
                  Add category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CategoriesSection />
            </CardContent>
          </Card>

          <AddCategoryModal
            open={isAddCategoryOpen}
            onClose={handleCloseAddCategory}
            onSubmit={handleCreateCategory}
            isSubmitting={isCreatingCategory}
          />

          <Card
            id="inventory-suppliers-section"
            variant="plain"
            className={activeSection === "Suppliers" ? "" : "hidden"}
          >
            <CardHeader className="pb-3 border-b bg-muted/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Suppliers
                  </CardTitle>
                  <CardDescription>
                    Manage the suppliers you purchase stock from.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="mt-1 sm:mt-0"
                  onClick={() => setIsAddSupplierOpen(true)}
                >
                  Add supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <SuppliersSection onEditSupplier={setEditingSupplier} />
            </CardContent>
          </Card>

          <SupplierModal
            open={isAddSupplierOpen}
            onClose={handleCloseAddSupplier}
            onSubmit={handleCreateSupplier}
            isSubmitting={isCreatingSupplier}
            mode="create"
          />

          <SupplierModal
            open={!!editingSupplier}
            onClose={handleCloseEditSupplier}
            onSubmit={handleUpdateSupplierSubmit}
            isSubmitting={isUpdatingSupplier}
            mode="edit"
            initialSupplier={editingSupplier}
          />
        </div>
      </div>
    </Layout>
  );
}

type AddUnitModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddUnitFormValues) => Promise<void> | void;
  isSubmitting: boolean;
};

function AddUnitModal({
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

type SuppliersSectionProps = {
  onEditSupplier: (supplier: ISupplierDto | null) => void;
};

function SuppliersSection({ onEditSupplier }: SuppliersSectionProps) {
  const { data, isLoading } = useGetSuppliersQuery();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();
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
          const message =
            getRTKQueryErrorMessage(error) ||
            "Failed to delete supplier. Please try again.";
          toast.error(message);
        } finally {
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground w-full">
        Loading suppliers...
      </div>
    );
  }

  if (!isLoading && suppliers.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground flex flex-col gap-1 w-full">
        <span className="font-medium">No suppliers yet</span>
        <span>
          Add suppliers you buy from so you can reference them in stock entries.
        </span>
      </div>
    );
  }

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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onEditSupplier(supplier)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit supplier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600 focus:text-red-600"
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete supplier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditSupplier(supplier)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit supplier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(supplier)}
                    className="text-red-600 focus:text-red-600"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete supplier
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

function SupplierModal({
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
                <Label htmlFor="supplier-name">Name</Label>
                <Input
                  id="supplier-name"
                  placeholder="e.g. ABC Pharmaceuticals"
                  {...register("name")}
                />
                {errors.name?.message && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="supplier-phone">Phone</Label>
                <Input
                  id="supplier-phone"
                  placeholder="e.g. 0803 000 0000"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplier-address">Address</Label>
              <Input
                id="supplier-address"
                placeholder="e.g. 12 Main Street, Lagos"
                {...register("address")}
              />
            </div>

            {mode === "edit" && (
              <div className="space-y-1">
                <Label htmlFor="supplier-status">Status</Label>
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

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddCategoryFormValues) => Promise<void> | void;
  isSubmitting: boolean;
};

function AddCategoryModal({
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
