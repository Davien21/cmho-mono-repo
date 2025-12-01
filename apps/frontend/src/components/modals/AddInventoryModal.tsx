import { useState, useEffect } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card } from "../ui/card";
import { UnitGroupingBuilder } from "../UnitGroupingBuilder";
import {
  InventoryCategory,
  InventoryStatus,
  UnitLevel,
} from "@/types/inventory";
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

interface AddInventoryModalProps {
  onClose: () => void;
}

const inventoryItemSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  inventoryCategory: yup.string().trim().required("Category is required"),
  lowStockValue: yup
    .string()
    .optional()
    .test(
      "is-number",
      "Low stock value must be a non-negative number",
      (value) => {
        if (!value) return true;
        const parsed = parseFloat(value);
        return !Number.isNaN(parsed) && parsed >= 0;
      }
    ),
  setupStatus: yup
    .mixed<InventoryStatus>()
    .oneOf(["draft", "ready"])
    .required(),
});

type InventoryItemFormValues = yup.InferType<typeof inventoryItemSchema>;

export function AddInventoryModal({ onClose }: AddInventoryModalProps) {
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const { data: categoriesResponse } = useGetInventoryCategoriesQuery();
  const [createInventoryItem] = useCreateInventoryItemMutation();

  const unitsPresets: IInventoryUnitDefinitionDto[] = unitsResponse?.data || [];
  const categories: IInventoryCategoryDto[] = categoriesResponse?.data || [];

  const unitNames: string[] = unitsPresets.map((u) => u.name);

  const getDefaultUnitsForCategory = (
    categoryName: InventoryCategory
  ): UnitLevel[] => {
    const category = categories.find((c) => c.name === categoryName);
    if (!category) {
      return [];
    }

    // Prefer populated unit presets if available from the API
    if (category.unitPresets && category.unitPresets.length > 0) {
      return category.unitPresets.map((u) => ({
        id: u._id,
        name: u.name,
        plural: u.plural,
        quantity: "",
      }));
    }

    // Fallback to legacy behavior using unitPresetIds + unitsPresets list
    if (!category.unitPresetIds || !category.unitPresetIds.length) {
      return [];
    }

    const presetUnits = category.unitPresetIds
      .map((id) => unitsPresets.find((u) => u._id === id))
      .filter((u): u is IInventoryUnitDefinitionDto => Boolean(u));

    return presetUnits.map((u) => ({
      id: u._id,
      name: u.name,
      plural: u.plural,
      quantity: "",
    }));
  };

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
      lowStockValue: "",
      setupStatus: "ready",
    },
  });

  const inventoryCategory = watch("inventoryCategory");

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  useEffect(() => {
    if (!inventoryCategory) {
      setUnits([]);
      setInitialUnits([]);

      // If we have categories and no category has been chosen yet, default to the first one
      if (categories.length > 0) {
        setValue("inventoryCategory", categories[0].name, {
          shouldValidate: true,
        });
      }
      return;
    }

    const defaultUnits = getDefaultUnitsForCategory(
      inventoryCategory as InventoryCategory
    );
    setUnits(defaultUnits);
    setInitialUnits(defaultUnits);
  }, [inventoryCategory, categories, unitsPresets, setValue]);

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
      // Backend treats `category` as the inventory category name
      const payload = {
        name: values.name.trim(),
        category: values.inventoryCategory as InventoryCategory,
        units: units.map((u) => ({
          id: u.id,
          name: u.name,
          plural: u.plural,
          quantity:
            typeof u.quantity === "string"
              ? parseFloat(u.quantity) || undefined
              : u.quantity,
        })),
        lowStockValue: values.lowStockValue
          ? parseFloat(values.lowStockValue)
          : undefined,
        setupStatus: values.setupStatus,
        status: "active" as const,
        currentStockInBaseUnits: 0,
      };

      await createInventoryItem(payload).unwrap();
      toast.success("Inventory item created successfully");
      onClose();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to create inventory item. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-2xl font-bold">Create Inventory Item</h2>
            <div className="flex items-center gap-3">
              <Controller
                name="setupStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as InventoryStatus)
                    }
                  >
                    <SelectTrigger
                      className={`w-[120px] h-9 text-sm font-medium border-0 shadow-none ${
                        field.value === "ready"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 bg-gray-100"
                onClick={onClose}
              >
                <X className="h-5 w-5 text-gray-700" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Paracetamol 500mg"
                  className="text-base"
                />
                {errors.name?.message && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory-category">Category</Label>
                <Controller
                  name="inventoryCategory"
                  control={control}
                  render={({ field }) => (
                    <InventoryCategorySelect
                      id="inventory-category"
                      value={field.value}
                      onChange={(v) => field.onChange(v as InventoryCategory)}
                      errorMessage={errors.inventoryCategory?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <UnitGroupingBuilder
              units={units}
              onChange={setUnits}
              initialUnits={initialUnits}
              availableUnitNames={unitNames}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lowStockValue">Low Stock Value</Label>
            <Input
              id="lowStockValue"
              type="number"
              {...register("lowStockValue")}
              placeholder="Enter minimum stock threshold"
              className="text-base"
              min="0"
              step="1"
            />
            {errors.lowStockValue?.message && (
              <p className="text-xs text-destructive mt-1">
                {errors.lowStockValue.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Alert when stock falls below this value (in base units)
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
