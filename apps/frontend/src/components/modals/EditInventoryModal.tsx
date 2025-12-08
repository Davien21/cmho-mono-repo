import { useState, useEffect, useRef, useMemo } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { UnitGroupingBuilder } from "../UnitGroupingBuilder";
import { InventoryItem, InventoryCategory, UnitLevel } from "@/types/inventory";
import {
  IInventoryUnitDefinitionDto,
  IInventoryCategoryDto,
  useGetInventoryItemsQuery,
  useGetInventoryUnitsQuery,
  useGetInventoryCategoriesQuery,
  useUpdateInventoryItemMutation,
} from "@/store/inventory-slice";
import { InventoryCategorySelect } from "@/components/InventoryCategorySelect";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { useMediaQuery } from "@/hooks/use-media-query";
import SegmentedControl from "@/SegmentedControl";

interface EditInventoryModalProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuantityInput {
  unitId: string;
  value: string;
}

const editInventoryItemSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  inventoryCategory: yup.string().trim().required("Category is required"),
  lowStockValue: yup
    .array()
    .of(
      yup.object({
        unitId: yup.string().required(),
        value: yup.string().required(),
      })
    )
    .optional(),
  canBeSold: yup.boolean().optional(),
});

type EditInventoryFormValues = yup.InferType<typeof editInventoryItemSchema>;

export function EditInventoryModal({
  item,
  open,
  onOpenChange,
}: EditInventoryModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  const isMobile = useMediaQuery("mobile");
  const [units, setUnits] = useState<UnitLevel[]>(item.units || []);
  const [initialUnits] = useState<UnitLevel[]>(item.units || []);

  // Store initial values for change detection
  const initialValuesRef = useRef({
    name: item.name,
    category: item.category,
    units: item.units || [],
    lowStockValue: item.lowStockValue,
    canBeSold: (item as any).canBeSold ?? true,
  });

  const { refetch } = useGetInventoryItemsQuery();
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const { data: categoriesResponse } = useGetInventoryCategoriesQuery();
  const unitsPresets: IInventoryUnitDefinitionDto[] = useMemo(
    () => unitsResponse?.data || [],
    [unitsResponse?.data]
  );
  const categories: IInventoryCategoryDto[] = useMemo(
    () => categoriesResponse?.data || [],
    [categoriesResponse?.data]
  );

  // Initialize low stock value as QuantityInput array
  const getInitialLowStockValue = (): QuantityInput[] => {
    if (!units.length) return [];
    return units.map((unit) => ({
      unitId: unit.id,
      value: "0",
    }));
  };

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditInventoryFormValues>({
    resolver: yupResolver(editInventoryItemSchema),
    defaultValues: {
      name: item.name,
      inventoryCategory: item.inventoryCategory,
      lowStockValue: getInitialLowStockValue(),
      canBeSold: (item as any).canBeSold ?? true,
    },
  });

  const inventoryCategory = watch("inventoryCategory");

  // Update low stock value when units are available
  useEffect(() => {
    if (units.length > 0) {
      const initialLowStock = getInitialLowStockValue();
      setValue("lowStockValue", initialLowStock);
    }
  }, [units, setValue]);

  // Prefill canBeSold from category when category changes
  useEffect(() => {
    if (inventoryCategory) {
      const selectedCategory = categories.find(
        (c) => c.name === inventoryCategory
      );
      if (selectedCategory) {
        setValue("canBeSold", selectedCategory.canBeSold ?? true);
      }
    }
  }, [inventoryCategory, categories, setValue]);

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  const calculateTotalInBaseUnits = (quantityInputs: QuantityInput[]) => {
    if (!units.length) return 0;

    let total = 0;

    units.forEach((unit, unitIndex) => {
      const input = quantityInputs.find((qi) => qi.unitId === unit.id);
      const qty = parseFloat(input?.value || "0");

      if (qty <= 0) return;

      // Calculate multiplier for this unit to base unit
      // Multiply all child unit quantities (units that come after this one)
      let multiplier = 1;
      for (let i = unitIndex + 1; i < units.length; i++) {
        multiplier *= units[i].quantity || 1;
      }

      total += qty * multiplier;
    });

    return total;
  };

  const [updateInventoryItem] = useUpdateInventoryItemMutation();

  const onSubmit = async (values: EditInventoryFormValues) => {
    if (units.length === 0) {
      alert("Please define at least one unit");
      return;
    }

    const baseUnit = getBaseUnit();

    if (!baseUnit) {
      alert("Please define at least one unit");
      return;
    }

    try {
      // Calculate low stock value in base units from quantity inputs
      const lowStockValueInBaseUnits = values.lowStockValue
        ? calculateTotalInBaseUnits(
            (values.lowStockValue || []) as QuantityInput[]
          )
        : undefined;

      const newName = values.name.trim();
      const newCategory = values.inventoryCategory as InventoryCategory;
      const newUnits = units.map((u) => ({
        id: u.id,
        name: u.name,
        plural: u.plural,
        quantity: u.quantity,
      }));
      const newLowStockValue =
        lowStockValueInBaseUnits && lowStockValueInBaseUnits > 0
          ? lowStockValueInBaseUnits
          : undefined;
      const newCanBeSold = values.canBeSold;

      // Detect changes by comparing with initial values
      const changedFields: string[] = [];
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      // Compare name
      if (newName !== initialValuesRef.current.name) {
        changedFields.push("name");
        oldValues.name = initialValuesRef.current.name;
        newValues.name = newName;
      }

      // Compare category
      if (newCategory !== initialValuesRef.current.category) {
        changedFields.push("category");
        oldValues.category = initialValuesRef.current.category;
        newValues.category = newCategory;
      }

      // Compare units (simplified: check if array length or structure changed)
      const unitsChanged =
        JSON.stringify(newUnits) !==
        JSON.stringify(initialValuesRef.current.units);
      if (unitsChanged) {
        changedFields.push("units");
        oldValues.units = initialValuesRef.current.units;
        newValues.units = newUnits;
      }

      // Compare lowStockValue
      // Check if the form array is still all zeros (default/unmodified)
      const isLowStockUnchanged =
        !values.lowStockValue ||
        values.lowStockValue.length === 0 ||
        values.lowStockValue.every((input) => {
          const val = parseFloat(input.value || "0");
          return val === 0 || isNaN(val);
        });

      // Only mark as changed if:
      // 1. The form was actually modified (not all zeros), AND
      // 2. The calculated value differs from the initial value
      if (!isLowStockUnchanged) {
        // Normalize values: treat undefined, null, and 0 as equivalent (no value set)
        const oldLowStock = initialValuesRef.current.lowStockValue;
        const normalizedOldLowStock =
          oldLowStock === undefined || oldLowStock === null || oldLowStock === 0
            ? undefined
            : oldLowStock;
        const normalizedNewLowStock =
          newLowStockValue === undefined ||
          newLowStockValue === null ||
          newLowStockValue === 0
            ? undefined
            : newLowStockValue;

        if (normalizedNewLowStock !== normalizedOldLowStock) {
          changedFields.push("lowStockValue");
          oldValues.lowStockValue = initialValuesRef.current.lowStockValue;
          newValues.lowStockValue = newLowStockValue;
        }
      }

      // Compare canBeSold
      if (newCanBeSold !== initialValuesRef.current.canBeSold) {
        changedFields.push("canBeSold");
        oldValues.canBeSold = initialValuesRef.current.canBeSold;
        newValues.canBeSold = newCanBeSold;
      }

      const updatePayload: any = {
        id: item.id,
        name: newName,
        category: newCategory,
        units: newUnits,
        lowStockValue: newLowStockValue,
        canBeSold: newCanBeSold,
      };

      // Include change metadata if there are any changes
      if (changedFields.length > 0) {
        updatePayload._changes = {
          changedFields,
          oldValues,
          newValues,
        };
      }

      await updateInventoryItem(updatePayload).unwrap();

      await refetch();
      toast.success("Inventory item updated successfully");
      handleClose();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update inventory item. Please try again.";
      toast.error(message);
    }
  };

  return (
    <ResponsiveDialog.Root open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-[550px] w-full max-h-[90vh] flex flex-col">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 space-y-4"
          >
            <ResponsiveDialog.Header className="px-0 xl:pr-10 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                  Edit Inventory Item
                </ResponsiveDialog.Title>
              </div>
              <ResponsiveDialog.Description className="sr-only">
                Edit the inventory item details below
              </ResponsiveDialog.Description>
            </ResponsiveDialog.Header>

            <div className="flex-1 min-h-0 overflow-y-auto px-1">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base sm:text-sm">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Paracetamol 500mg"
                      className="text-base sm:text-sm h-11 sm:h-9"
                    />
                    {errors.name?.message && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-inventory-category"
                      className="text-base sm:text-sm"
                    >
                      Category
                    </Label>
                    <Controller
                      name="inventoryCategory"
                      control={control}
                      render={({ field }) => (
                        <InventoryCategorySelect
                          id="edit-inventory-category"
                          value={field.value}
                          onChange={(v) =>
                            field.onChange(v as InventoryCategory)
                          }
                          errorMessage={errors.inventoryCategory?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <UnitGroupingBuilder
                  units={units}
                  onChange={setUnits}
                  initialUnits={initialUnits}
                  presets={unitsPresets}
                />
              </div>

              {units.length > 0 && (
                <div className="space-y-2 mt-4">
                  <UnitBasedInput
                    control={control}
                    name="lowStockValue"
                    units={units}
                    label="Low Stock Value *"
                    error={errors.lowStockValue?.message}
                  />
                  <p className="text-xs text-muted-foreground hidden md:block mt-2">
                    We will alert you when stock falls below this value
                  </p>
                </div>
              )}

              <div className="flex items-center gap-10 mt-4">
                <Label className="text-base sm:text-sm text-gray-700">
                  Will this item be sold?
                </Label>
                <Controller
                  name="canBeSold"
                  control={control}
                  render={({ field }) => (
                    <SegmentedControl
                      size="small"
                      minItemWidth={70}
                      value={field.value ? "yes" : "no"}
                      onChange={(value) => field.onChange(value === "yes")}
                      options={[
                        { id: "no", label: "No" },
                        { id: "yes", label: "Yes" },
                      ]}
                    />
                  )}
                />
              </div>

              <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-6 border-t px-0 flex-shrink-0 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size={isMobile ? "lg" : "default"}
                  onClick={handleClose}
                  className="w-full sm:w-auto text-base sm:text-sm h-11 sm:h-9 px-6 sm:px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size={isMobile ? "lg" : "default"}
                  className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-base sm:text-sm h-11 sm:h-9 px-6 sm:px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Item"}
                </Button>
              </ResponsiveDialog.Footer>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
