import { useState } from "react";
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
  IInventoryUnitDefinitionDto,
  IInventoryCategoryDto,
} from "@/store/inventory-slice";
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
import { Package, Tags } from "lucide-react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";

function UnitsSection() {
  const { data, isLoading } = useGetInventoryUnitsQuery();
  const [updateUnit, { isLoading: isUpdating }] =
    useUpdateInventoryUnitMutation();
  const [deleteUnit, { isLoading: isDeleting }] =
    useDeleteInventoryUnitMutation();
  const { openModal, closeModal } = useModalContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPlural, setEditingPlural] = useState("");

  const units: IInventoryUnitDefinitionDto[] = data?.data || [];

  const startEdit = (unit: IInventoryUnitDefinitionDto) => {
    setEditingId(unit._id);
    setEditingName(unit.name);
    setEditingPlural(unit.plural);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim() || !editingPlural.trim()) return;
    await updateUnit({
      id: editingId,
      name: editingName.trim(),
      plural: editingPlural.trim(),
    }).unwrap();
    setEditingId(null);
    setEditingName("");
    setEditingPlural("");
  };

  const handleDelete = (id: string, name: string) => {
    openModal("confirmation-dialog", {
      title: "Delete unit",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        await deleteUnit(id).unwrap();
        closeModal("confirmation-dialog");
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
            <div
              key={unit._id}
              className="inline-flex items-center bg-muted rounded-full px-3 py-2 gap-2"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  aria-label="Unit name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-8"
                />
                <Input
                  aria-label="Unit plural"
                  value={editingPlural}
                  onChange={(e) => setEditingPlural(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="h-8 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
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
  const [editingName, setEditingName] = useState("");

  const startEdit = (category: IInventoryCategoryDto) => {
    setEditingId(category._id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    await updateCategory({
      id: editingId,
      name: editingName.trim(),
    }).unwrap();
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (id: string, name: string) => {
    openModal("confirmation-dialog", {
      title: "Delete category",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        await deleteCategory(id).unwrap();
        closeModal("confirmation-dialog");
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
            <div
              key={category._id}
              className="inline-flex items-center bg-muted rounded-full px-3 py-2 gap-2"
            >
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-8"
              />
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="h-8 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
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
  const [createUnit, { isLoading: isCreatingUnit }] =
    useCreateInventoryUnitMutation();
  const [createCategory, { isLoading: isCreatingCategory }] =
    useCreateInventoryCategoryMutation();

  const unitsCount = unitsSummary?.data?.length ?? 0;
  const categoriesCount = categoriesSummary?.data?.length ?? 0;

  const [activeSection, setActiveSection] = useState<"Units" | "Categories">(
    "Units"
  );

  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitPlural, setNewUnitPlural] = useState("");

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCloseAddUnit = () => {
    setIsAddUnitOpen(false);
    setNewUnitName("");
    setNewUnitPlural("");
  };

  const handleCreateUnit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUnitName.trim() || !newUnitPlural.trim()) return;
    await createUnit({
      name: newUnitName.trim(),
      plural: newUnitPlural.trim(),
    }).unwrap();
    handleCloseAddUnit();
  };

  const handleCloseAddCategory = () => {
    setIsAddCategoryOpen(false);
    setNewCategoryName("");
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;
    await createCategory({
      name: newCategoryName.trim(),
    }).unwrap();
    handleCloseAddCategory();
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
                  value === "Categories" ? "Categories" : "Units"
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
            name={newUnitName}
            plural={newUnitPlural}
            onNameChange={setNewUnitName}
            onPluralChange={setNewUnitPlural}
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
            name={newCategoryName}
            onNameChange={setNewCategoryName}
            onSubmit={handleCreateCategory}
            isSubmitting={isCreatingCategory}
          />
        </div>
      </div>
    </Layout>
  );
}

type AddUnitModalProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  plural: string;
  onNameChange: (value: string) => void;
  onPluralChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isSubmitting: boolean;
};

function AddUnitModal({
  open,
  onClose,
  name,
  plural,
  onNameChange,
  onPluralChange,
  onSubmit,
  isSubmitting,
}: AddUnitModalProps) {
  return (
    <ResponsiveDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
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
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label htmlFor="new-unit-name">Name</Label>
              <Input
                id="new-unit-name"
                placeholder="e.g. Pack"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-unit-plural">Plural</Label>
              <Input
                id="new-unit-plural"
                placeholder="e.g. Packs"
                value={plural}
                onChange={(e) => onPluralChange(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim() || !plural.trim()}
              >
                {isSubmitting ? "Adding..." : "Add unit"}
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
  name: string;
  onNameChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isSubmitting: boolean;
};

function AddCategoryModal({
  open,
  onClose,
  name,
  onNameChange,
  onSubmit,
  isSubmitting,
}: AddCategoryModalProps) {
  return (
    <ResponsiveDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
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
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
            className="space-y-4 mt-4"
          >
            <div className="space-y-1">
              <Label htmlFor="new-category-name">Name</Label>
              <Input
                id="new-category-name"
                placeholder="e.g. Drug"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Adding..." : "Add category"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
