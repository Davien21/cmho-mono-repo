import { useState } from "react";
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
  InventoryItem,
  InventoryCategory,
  InventoryStatus,
  UnitLevel,
} from "@/types/inventory";
import {
  IInventoryUnitDefinitionDto,
  useGetInventoryItemsQuery,
  useGetInventoryUnitsQuery,
  useUpdateInventoryItemMutation,
} from "@/store/inventory-slice";
import { InventoryCategorySelect } from "@/components/InventoryCategorySelect";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

interface EditInventoryModalProps {
  item: InventoryItem;
  onClose: () => void;
}

const editInventoryItemSchema = yup.object({
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

type EditInventoryFormValues = yup.InferType<typeof editInventoryItemSchema>;

export function EditInventoryModal({ item, onClose }: EditInventoryModalProps) {
  const [units, setUnits] = useState<UnitLevel[]>(item.units || []);
  const [initialUnits] = useState<UnitLevel[]>(item.units || []);

  const { refetch } = useGetInventoryItemsQuery();
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const unitsPresets: IInventoryUnitDefinitionDto[] = unitsResponse?.data || [];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditInventoryFormValues>({
    resolver: yupResolver(editInventoryItemSchema),
    defaultValues: {
      name: item.name,
      inventoryCategory: item.inventoryCategory,
      lowStockValue:
        item.lowStockValue !== undefined ? String(item.lowStockValue) : "",
      setupStatus: item.status,
    },
  });

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  const [updateInventoryItem, { isLoading: isUpdating }] =
    useUpdateInventoryItemMutation();

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
      await updateInventoryItem({
        id: item.id,
        name: values.name.trim(),
        category: values.inventoryCategory as InventoryCategory,
        units: units.map((u) => ({
          id: u.id,
          name: u.name,
          plural: u.plural,
          quantity: u.quantity,
        })),
        lowStockValue: values.lowStockValue
          ? parseFloat(values.lowStockValue)
          : undefined,
        setupStatus: values.setupStatus,
      }).unwrap();

      await refetch();
      toast.success("Inventory item updated successfully");
      onClose();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update inventory item. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
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
                <Label htmlFor="edit-inventory-category">Category</Label>
                <Controller
                  name="inventoryCategory"
                  control={control}
                  render={({ field }) => (
                    <InventoryCategorySelect
                      id="edit-inventory-category"
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
              presets={unitsPresets}
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
              disabled={isUpdating || isSubmitting}
            >
              {isUpdating || isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
