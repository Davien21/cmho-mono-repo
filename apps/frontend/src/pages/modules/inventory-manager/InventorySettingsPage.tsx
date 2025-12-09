import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Upload } from "lucide-react";
import {
  useGetInventoryUnitsQuery,
  useCreateInventoryUnitMutation,
  useGetInventoryCategoriesQuery,
  useCreateInventoryCategoryMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  ISupplierDto,
  SupplierStatus,
} from "@/store/inventory-slice";
import {
  UnitsSection,
  AddUnitModal,
  AddUnitFormValues,
} from "@/features/inventory-settings/InventorySettingsPage/units";
import {
  CategoriesSection,
  AddCategoryModal,
  AddCategoryFormValues,
} from "@/features/inventory-settings/InventorySettingsPage/categories";
import {
  SuppliersSection,
  SupplierModal,
  SupplierFormValues,
} from "@/features/inventory-settings/InventorySettingsPage/suppliers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Tags,
  Truck,
  Image as ImageIcon,
  Plus,
  Check,
  RotateCcw,
} from "lucide-react";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { GallerySection } from "@/features/inventory-settings/InventorySettingsPage/gallery";
import { useGetGalleryQuery } from "@/store/gallery-slice";
import SegmentedControl from "@/SegmentedControl";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function InventorySettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Show segmented control on screens >= 640px (sm breakpoint)
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const { data: unitsSummary } = useGetInventoryUnitsQuery();
  const { data: categoriesSummary } = useGetInventoryCategoriesQuery();
  const { data: suppliersSummary } = useGetSuppliersQuery();
  // Use the same query as GallerySection - RTK Query will share the cache
  // Only fetch if gallery section is active or we need the count
  const { data: galleryData } = useGetGalleryQuery(
    { page: 1, limit: 100 },
    { skip: false } // Always fetch to get count for badge
  );
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
  const galleryCount = galleryData?.data?.meta?.total ?? 0;

  // Get active section from URL params, default to "Units"
  const sectionParam = searchParams.get("section");
  const activeSection: "Units" | "Categories" | "Suppliers" | "Gallery" = (
    sectionParam === "Categories" ||
    sectionParam === "Suppliers" ||
    sectionParam === "Gallery"
      ? sectionParam
      : "Units"
  ) as "Units" | "Categories" | "Suppliers" | "Gallery";

  const setActiveSection = (
    section: "Units" | "Categories" | "Suppliers" | "Gallery"
  ) => {
    setSearchParams({ section });
  };

  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplierDto | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [unitsSaveButton, setUnitsSaveButton] = useState<{
    hasPendingChanges: boolean;
    onSave: () => void;
    onUndo: () => void;
    isSaving: boolean;
  } | null>(null);
  const [categoriesSaveButton, setCategoriesSaveButton] = useState<{
    hasPendingChanges: boolean;
    onSave: () => void;
    onUndo: () => void;
    isSaving: boolean;
  } | null>(null);
  // _dragCounter tracks nested drag events (when dragging over child elements)
  const [_dragCounter, setDragCounter] = useState(0);
  const processFilesRef = useRef<((files: File[]) => Promise<void>) | null>(
    null
  );
  const contentAreaRef = useRef<HTMLDivElement>(null);

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
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to add unit. Please try again."
      );
      toast.error(message);
    }
  };

  const handleCloseAddCategory = () => {
    setIsAddCategoryOpen(false);
  };

  const handleCreateCategory = async (
    values: AddCategoryFormValues & { unitPresetIds?: string[] }
  ) => {
    try {
      await createCategory({
        name: values.name.trim(),
        unitPresetIds: values.unitPresetIds,
        canBeSold: values.canBeSold,
      }).unwrap();
      toast.success("Category added successfully");
      handleCloseAddCategory();
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to add category. Please try again."
      );
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
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to add supplier. Please try again."
      );
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
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to update supplier. Please try again."
      );
      toast.error(message);
    }
  };

  // Drag and drop handlers - only active when in Gallery mode
  const handleDragEnter = (e: React.DragEvent) => {
    if (activeSection !== "Gallery") return;
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (activeSection !== "Gallery") return;
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (activeSection !== "Gallery") return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (activeSection !== "Gallery") return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && processFilesRef.current) {
      await processFilesRef.current(files);
    }
  };

  // Reset drag state when switching away from Gallery
  useEffect(() => {
    if (activeSection !== "Gallery") {
      setIsDragging(false);
      setDragCounter(0);
    }
  }, [activeSection]);

  return (
    <Layout>
      <div
        ref={contentAreaRef}
        className="relative flex flex-col gap-6 h-full"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay - only show when dragging and in Gallery mode */}
        {isDragging && activeSection === "Gallery" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-background/95 backdrop-blur-md rounded-lg border-2 border-dashed border-primary shadow-lg">
              <Upload className="h-20 w-20 sm:h-16 sm:w-16 text-primary animate-bounce" />
              <div className="text-center">
                <p className="text-xl sm:text-lg font-semibold text-foreground">
                  Drop images here to upload
                </p>
                <p className="text-base sm:text-sm text-muted-foreground mt-2">
                  Supported formats: JPEG, JPG, PNG, WEBP, HEIC
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Inventory settings
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            Configure settings that are used across your inventory.
          </p>
        </div>

        {/* Main content layout */}
        <div className="space-y-4">
          {/* Segmented control: visible on desktop, hidden on mobile (use sidebar submenu on mobile) */}
          {/* On desktop, both segmented control and sidebar submenu are available */}
          {isDesktop && (
            <div className="w-full">
              <SegmentedControl
                value={activeSection}
                onChange={(value) =>
                  setActiveSection(
                    value === "Categories"
                      ? "Categories"
                      : value === "Suppliers"
                      ? "Suppliers"
                      : value === "Gallery"
                      ? "Gallery"
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
                  {
                    id: "Gallery",
                    content: (
                      <div className="flex items-center gap-2">
                        <span>Gallery</span>
                        <Badge className="text-[11px] font-medium px-2 py-0 h-5 rounded-full bg-slate-100 text-slate-700">
                          {galleryCount}
                        </Badge>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}

          <Card
            id="inventory-units-section"
            variant="plain"
            className={activeSection === "Units" ? "" : "hidden"}
          >
            <CardHeader className="pb-3 border-b bg-muted/40 px-0 lg:px-6 pt-0 lg:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                    Inventory Units
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-sm">
                    Start with the base units you stock and sell with.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  {unitsSaveButton?.hasPendingChanges && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                        onClick={unitsSaveButton.onUndo}
                        disabled={unitsSaveButton.isSaving}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Undo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                        onClick={unitsSaveButton.onSave}
                        disabled={unitsSaveButton.isSaving}
                      >
                        <Check className="h-4 w-4" />
                        {unitsSaveButton.isSaving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    className="text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                    onClick={() => setIsAddUnitOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add unit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <UnitsSection onSaveButtonChange={setUnitsSaveButton} />
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
            <CardHeader className="pb-3 border-b bg-muted/40 px-0 lg:px-6 pt-0 lg:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Tags className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                    Inventory Categories
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-sm">
                    Categories are simply the type of items that you stock up
                    on.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  {categoriesSaveButton?.hasPendingChanges && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                        onClick={categoriesSaveButton.onUndo}
                        disabled={categoriesSaveButton.isSaving}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Undo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                        onClick={categoriesSaveButton.onSave}
                        disabled={categoriesSaveButton.isSaving}
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        {categoriesSaveButton.isSaving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    className="text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                    onClick={() => setIsAddCategoryOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add category
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <CategoriesSection onSaveButtonChange={setCategoriesSaveButton} />
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
            <CardHeader className="pb-3 border-b bg-muted/40 px-0 lg:px-6 pt-0 lg:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Truck className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                    Suppliers
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-sm">
                    Manage the suppliers you purchase stock from.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="mt-1 sm:mt-0 text-sm sm:text-sm px-4 py-2 h-9 sm:h-8"
                  onClick={() => setIsAddSupplierOpen(true)}
                >
                  Add supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
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

          <Card
            id="inventory-gallery-section"
            variant="plain"
            className={activeSection === "Gallery" ? "" : "hidden"}
          >
            <CardHeader className="pb-3 border-b bg-muted/40 px-0 lg:px-6 pt-0 lg:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                    Media Gallery
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-sm">
                    Upload and manage images for your inventory items.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <GallerySection
                onProcessFilesReady={(processFiles) => {
                  processFilesRef.current = processFiles;
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
