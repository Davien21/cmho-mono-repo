import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { UnitGroupingBuilder } from "../UnitGroupingBuilder";
import { UnitLevel } from "@/types/inventory";
import { InventoryCategorySelect } from "@/components/InventoryCategorySelect";
import {
  IInventoryCategoryDto,
  IInventoryUnitDefinitionDto,
  useCreateInventoryItemMutation,
  useGetInventoryCategoriesQuery,
  useGetInventoryUnitsQuery,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import SegmentedControl from "@/SegmentedControl";
import { useModalContext } from "@/contexts/modal-context";

interface QuantityInput {
  unitId: string;
  value: string;
}

const inventoryItemSchema = yup.object({
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

type InventoryItemFormValues = yup.InferType<typeof inventoryItemSchema>;

export function AddInventoryModal() {
  const { modals, closeModal } = useModalContext();
  const open = modals["add-inventory"]?.isOpen || false;

  const handleClose = () => {
    closeModal("add-inventory");
  };
  const isMobile = useMediaQuery("mobile");
  const hasSetInitialCategory = useRef(false);
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const { data: categoriesResponse } = useGetInventoryCategoriesQuery();
  const [createInventoryItem] = useCreateInventoryItemMutation();

  const unitsPresets: IInventoryUnitDefinitionDto[] = useMemo(
    () => unitsResponse?.data || [],
    [unitsResponse?.data]
  );

  const categories: IInventoryCategoryDto[] = useMemo(
    () => categoriesResponse?.data || [],
    [categoriesResponse?.data]
  );

  const getDefaultUnitsForCategory = useCallback(
    (categoryName: string): UnitLevel[] => {
      const category = categories.find((c) => c.name === categoryName);
      if (!category) {
        return [];
      }

      // Prefer populated unit presets if available from the API
      if (category.unitPresets && category.unitPresets.length > 0) {
        return category.unitPresets.map((u, index) => ({
          id: u._id, // Use the preset ObjectId directly
          name: u.name,
          plural: u.plural,
          // Top-level unit (first in array) defaults to 1, others default to undefined
          quantity: index === 0 ? 1 : undefined,
        }));
      }

      // Fallback to legacy behavior using unitPresetIds + unitsPresets list
      if (!category.unitPresetIds || !category.unitPresetIds.length) {
        return [];
      }

      const presetUnits = category.unitPresetIds
        .map((id) => unitsPresets.find((u) => u._id === id))
        .filter((u): u is IInventoryUnitDefinitionDto => Boolean(u));

      return presetUnits.map((u, index) => ({
        id: u._id, // Use the preset ObjectId directly
        name: u.name,
        plural: u.plural,
        // Top-level unit (first in array) defaults to 1, others default to undefined
        quantity: index === 0 ? 1 : undefined,
      }));
    },
    [categories, unitsPresets]
  );

  const getInitialUnits = () => {
    return [] as UnitLevel[];
  };

  const [units, setUnits] = useState<UnitLevel[]>(getInitialUnits);

  const [initialUnits, setInitialUnits] =
    useState<UnitLevel[]>(getInitialUnits);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormValues>({
    resolver: yupResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      inventoryCategory: "",
      lowStockValue: [],
      canBeSold: true,
    },
  });

  const inventoryCategory = watch("inventoryCategory");

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  const calculateTotalInBaseUnits = useMemo(() => {
    return (quantityInputs: QuantityInput[]) => {
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
  }, [units]);

  useEffect(() => {
    if (!inventoryCategory) {
      setUnits([]);
      setInitialUnits([]);
      setValue("lowStockValue", []);

      // If we have categories and no category has been chosen yet, default to the first one
      // Only set it once when the modal opens and categories are available
      if (categories.length > 0 && !hasSetInitialCategory.current) {
        hasSetInitialCategory.current = true;
        setValue("inventoryCategory", categories[0].name, {
          shouldValidate: true,
        });
      }
      return;
    }

    // Reset the flag when a category is selected
    hasSetInitialCategory.current = true;

    const defaultUnits = getDefaultUnitsForCategory(inventoryCategory);
    setUnits(defaultUnits);
    setInitialUnits(defaultUnits);
    // Reset low stock value when units change
    const initialLowStock = defaultUnits.map((unit) => ({
      unitId: unit.id,
      value: "0",
    }));
    setValue("lowStockValue", initialLowStock);

    // Prefill canBeSold from category
    const selectedCategory = categories.find(
      (c) => c.name === inventoryCategory
    );
    if (selectedCategory) {
      setValue("canBeSold", selectedCategory.canBeSold ?? true);
    }
  }, [
    inventoryCategory,
    categories,
    unitsPresets,
    setValue,
    getDefaultUnitsForCategory,
  ]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      hasSetInitialCategory.current = false;
    }
  }, [open]);

  const onSubmit = async (values: InventoryItemFormValues) => {
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

      // Find category from category name
      const selectedCategory = categories.find(
        (c) => c.name === values.inventoryCategory
      );
      if (!selectedCategory) {
        toast.error("Invalid category selected");
        return;
      }

      // Backend expects category as embedded object with _id and name
      const payload: any = {
        name: values.name.trim(),
        category: {
          _id: selectedCategory._id,
          name: selectedCategory.name,
        },
        units: units.map((u) => ({
          id: u.id,
          name: u.name,
          plural: u.plural,
          quantity: u.quantity,
        })),
        lowStockValue:
          lowStockValueInBaseUnits && lowStockValueInBaseUnits > 0
            ? lowStockValueInBaseUnits
            : 10,
        status: "active" as const,
        currentStockInBaseUnits: 0,
        canBeSold: values.canBeSold,
      };

      await createInventoryItem(payload).unwrap();
      toast.success("Inventory item created successfully");
      handleClose();
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to create inventory item. Please try again."
      );
      toast.error(message);
    }
  };

  return (
    <ResponsiveDialog.Root
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModal("add-inventory")}
    >
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
                  Create Inventory Item
                </ResponsiveDialog.Title>
              </div>
              <ResponsiveDialog.Description className="sr-only">
                Create a new inventory item by filling in the details below
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
                      htmlFor="inventory-category"
                      className="text-base sm:text-sm"
                    >
                      Category
                    </Label>
                    <Controller
                      name="inventoryCategory"
                      control={control}
                      render={({ field }) => (
                        <InventoryCategorySelect
                          id="inventory-category"
                          value={field.value}
                          onChange={field.onChange}
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
                  <p className="text-xs text-muted-foreground hidden md:block mt-2 mb-2">
                    We will alert you when stock falls below this value
                  </p>
                </div>
              )}

              <div className="flex items-center gap-10 mt-4">
                <Label className="text-base sm:text-sm text-gray-700">
                  Is this item for sale?
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
                  {isSubmitting ? "Creating..." : "Create Item"}
                </Button>
              </ResponsiveDialog.Footer>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
