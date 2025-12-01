import { useState } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import SegmentedControl from '@/SegmentedControl';
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
} from '@/store/inventory-slice';
import {
  UnitsSection,
  AddUnitModal,
  AddUnitFormValues,
} from '@/features/inventory-settings/InventorySettingsPage/units';
import {
  CategoriesSection,
  AddCategoryModal,
  AddCategoryFormValues,
} from '@/features/inventory-settings/InventorySettingsPage/categories';
import {
  SuppliersSection,
  SupplierModal,
  SupplierFormValues,
} from '@/features/inventory-settings/InventorySettingsPage/suppliers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Tags, Truck } from 'lucide-react';
import { getRTKQueryErrorMessage } from '@/lib/utils';
export default function InventorySettingsPage() {
  const { data: unitsSummary } = useGetInventoryUnitsQuery();
  const { data: categoriesSummary } = useGetInventoryCategoriesQuery();
  const { data: suppliersSummary } = useGetSuppliersQuery();
  const [createUnit, { isLoading: isCreatingUnit }] = useCreateInventoryUnitMutation();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateInventoryCategoryMutation();
  const [createSupplier, { isLoading: isCreatingSupplier }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdatingSupplier }] = useUpdateSupplierMutation();

  const unitsCount = unitsSummary?.data?.length ?? 0;
  const categoriesCount = categoriesSummary?.data?.length ?? 0;
  const suppliersCount = suppliersSummary?.data?.length ?? 0;

  const [activeSection, setActiveSection] = useState<'Units' | 'Categories' | 'Suppliers'>('Units');

  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplierDto | null>(null);

  const handleCloseAddUnit = () => {
    setIsAddUnitOpen(false);
  };

  const handleCreateUnit = async (values: AddUnitFormValues) => {
    try {
      await createUnit({
        name: values.name.trim(),
        plural: values.plural.trim(),
      }).unwrap();
      toast.success('Unit added successfully');
      handleCloseAddUnit();
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(error) || 'Failed to add unit. Please try again.';
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
      toast.success('Category added successfully');
      handleCloseAddCategory();
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(error) || 'Failed to add category. Please try again.';
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
        status: (values.status ?? 'active') as SupplierStatus,
      }).unwrap();
      toast.success('Supplier added successfully');
      handleCloseAddSupplier();
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(error) || 'Failed to add supplier. Please try again.';
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
        status: (values.status ?? 'active') as SupplierStatus,
      }).unwrap();
      toast.success('Supplier updated successfully');
      handleCloseEditSupplier();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) || 'Failed to update supplier. Please try again.';
      toast.error(message);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Inventory settings</h1>
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
                  value === 'Categories'
                    ? 'Categories'
                    : value === 'Suppliers'
                      ? 'Suppliers'
                      : 'Units'
                )
              }
              options={[
                {
                  id: 'Units',
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
                  id: 'Categories',
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
                  id: 'Suppliers',
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
            className={activeSection === 'Units' ? '' : 'hidden'}
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
                <Button size="sm" className="mt-1 sm:mt-0" onClick={() => setIsAddUnitOpen(true)}>
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
            className={activeSection === 'Categories' ? '' : 'hidden'}
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
            className={activeSection === 'Suppliers' ? '' : 'hidden'}
          >
            <CardHeader className="pb-3 border-b bg-muted/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Suppliers
                  </CardTitle>
                  <CardDescription>Manage the suppliers you purchase stock from.</CardDescription>
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
