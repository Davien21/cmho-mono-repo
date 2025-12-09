import { useState, useEffect, useMemo, useCallback } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { InventoryItem } from "@/types/inventory";
import { formatUnitName, getRTKQueryErrorMessage } from "@/lib/utils";
import {
  useCreateStockEntryMutation,
  useGetInventoryItemsQuery,
  useGetStockEntriesQuery,
} from "@/store/inventory-slice";
import { toast } from "sonner";
import { InventorySupplierSelect } from "@/components/InventorySupplierSelect";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MonthPickerInput } from "@/components/ui/month-picker-input";

interface AddStockModalProps {
  inventoryItem: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuantityInput {
  unitId: string;
  value: string;
}

interface IProfit {
  percent: string;
  amount: string;
}

const addStockSchema = yup.object({
  expiryDate: yup
    .date()
    .required("Expiry date is required")
    .typeError("Expiry date is required"),
  costPrice: yup
    .string()
    .required("Cost price is required")
    .test("is-valid-cost", "Cost price must be greater than 0", (value) => {
      const parsed = parseFloat(value ?? "");
      return !Number.isNaN(parsed) && parsed > 0;
    }),
  sellingPrice: yup
    .string()
    .required("Selling price is required")
    .test(
      "is-valid-selling",
      "Selling price must be greater than 0",
      (value) => {
        const parsed = parseFloat(value ?? "");
        return !Number.isNaN(parsed) && parsed > 0;
      }
    ),
  quantity: yup
    .array()
    .of(
      yup.object({
        unitId: yup.string().required(),
        value: yup.string().required(),
      })
    )
    .test(
      "has-quantity",
      "Please enter a quantity greater than 0",
      function (quantityInputs) {
        if (!quantityInputs || quantityInputs.length === 0) return false;
        return quantityInputs.some((input) => {
          const qty = parseFloat(input.value || "0");
          return qty > 0;
        });
      }
    )
    .required("Quantity is required"),
});

type AddStockFormValues = {
  expiryDate?: Date;
  costPrice?: string;
  sellingPrice?: string;
  quantity: QuantityInput[];
};

const getProfitText = (profit: IProfit): string => {
  if (!profit.percent || !profit.amount) return "Unknown";
  return `${profit.percent}% (₦${profit.amount})`;
};

const getExpiryDate = (date: Date | undefined): Date | undefined => {
  if (!date) return undefined;
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
};

export function AddStockModal({
  inventoryItem,
  open,
  onOpenChange,
}: AddStockModalProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const { refetch: refetchItems } = useGetInventoryItemsQuery();
  const { refetch: refetchStockEntries } = useGetStockEntriesQuery();
  const [createStockEntry, { isLoading: isCreatingStockEntry }] =
    useCreateStockEntryMutation();

  const getInitialQuantity = useCallback((): QuantityInput[] => {
    if (!inventoryItem) return [];
    const sortedUnits = inventoryItem.units;
    return sortedUnits.map((unit) => ({ unitId: unit.id, value: "0" }));
  }, [inventoryItem]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<AddStockFormValues>({
    resolver: yupResolver(addStockSchema) as any,
    defaultValues: {
      expiryDate: undefined,
      costPrice: "",
      sellingPrice: "",
      quantity: getInitialQuantity(),
    },
  });

  const costPrice = watch("costPrice");
  const sellingPrice = watch("sellingPrice");

  // Reset form when inventoryItem changes
  useEffect(() => {
    if (!inventoryItem) return;
    const initialQuantity = getInitialQuantity();
    reset({
      expiryDate: undefined,
      costPrice: "",
      sellingPrice: "",
      quantity: initialQuantity,
    });
    setSupplierId(null);
    setSupplierName(null);
  }, [inventoryItem, reset, getInitialQuantity]);

  const getBaseUnit = () => {
    if (!inventoryItem) return null;
    const units = inventoryItem.units;
    return units.length > 0 ? units[units.length - 1] : null;
  };

  const calculateTotalInBaseUnits = useMemo(() => {
    return (quantityInputs: QuantityInput[]) => {
      if (!inventoryItem) return 0;

      const units = inventoryItem.units;
      let total = 0;

      units.forEach((unit, unitIndex) => {
        const input = quantityInputs.find((qi) => qi.unitId === unit.id);
        const qty = parseFloat(input?.value || "0");

        if (qty <= 0) return;
        let multiplier = 1;
        for (let i = unitIndex + 1; i < units.length; i++) {
          multiplier *= units[i].quantity || 1;
        }

        total += qty * multiplier;
      });

      return total;
    };
  }, [inventoryItem]);

  const calculateProfit = (): IProfit => {
    const cost = parseFloat(costPrice || "0") || 0;
    const selling = parseFloat(sellingPrice || "0") || 0;
    if (cost === 0) return { percent: "0.0", amount: "0" };
    const profitAmount = selling - cost;
    const profitPercent = ((profitAmount / cost) * 100).toFixed(1);
    return {
      percent: profitPercent,
      amount: profitAmount.toFixed(2),
    };
  };

  const onSubmit = async (values: AddStockFormValues) => {
    if (!inventoryItem) return;

    const totalQuantity = calculateTotalInBaseUnits(values.quantity || []);

    try {
      const expiryDate = getExpiryDate(values.expiryDate);

      const payload: any = {
        inventoryItemId: inventoryItem.id,
        operationType: "add",
        supplier:
          !supplierId || !supplierName
            ? null
            : {
                supplierId,
                name: supplierName,
              },
        quantityInBaseUnits: totalQuantity,
        costPrice: parseFloat(values.costPrice || "0"),
        sellingPrice: parseFloat(values.sellingPrice || "0"),
        expiryDate: expiryDate,
      };

      await createStockEntry(payload).unwrap();

      await Promise.all([refetchItems(), refetchStockEntries()]);

      toast.success("Stock added successfully");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to add stock. Please try again."
      );
      toast.error(message);
    }
  };

  const baseUnit = getBaseUnit();
  const profit = calculateProfit();

  if (!inventoryItem) return null;

  return (
    <ResponsiveDialog.Root open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-[550px] w-full max-h-[90vh] flex flex-col">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <ResponsiveDialog.Header className="px-0 flex-shrink-0">
              <div>
                <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                  Add Stock
                </ResponsiveDialog.Title>
                <p className="text-sm text-muted-foreground mt-1">
                  {inventoryItem.name}
                </p>
              </div>
            </ResponsiveDialog.Header>

            <div className="flex-1 min-h-0 overflow-y-auto px-1 mt-6">
              <div className="space-y-4">
                {/* Supplier and Expiry Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventory-supplier">
                      Supplier (Optional)
                    </Label>
                    <InventorySupplierSelect
                      id="inventory-supplier"
                      value={supplierId}
                      onChange={(supplier) => {
                        setSupplierId(supplier?.id ?? null);
                        setSupplierName(supplier?.name ?? null);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Controller
                      name="expiryDate"
                      control={control}
                      render={({ field }) => (
                        <MonthPickerInput
                          id="expiryDate"
                          value={field.value}
                          onChange={(date: Date | undefined) => {
                            field.onChange(date);
                          }}
                          placeholder="Select month and year"
                          required
                        />
                      )}
                    />
                    {errors.expiryDate?.message && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.expiryDate.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">
                        Cost Price in ₦ (per{" "}
                        {baseUnit ? formatUnitName(baseUnit, 1) : "unit"}) *
                      </Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        {...register("costPrice")}
                        placeholder="0.00"
                        required
                      />
                      {errors.costPrice?.message && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.costPrice.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">
                        Selling Price in ₦ (per{" "}
                        {baseUnit ? formatUnitName(baseUnit, 1) : "unit"}) *
                      </Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        step="0.01"
                        {...register("sellingPrice")}
                        placeholder="0.00"
                        required
                      />
                      {errors.sellingPrice?.message && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.sellingPrice.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    <span className="">Profit: </span>
                    <span className="font-medium text-foreground">
                      {getProfitText(profit)}
                    </span>
                  </p>
                </div>

                {/* Quantity Section */}
                <div className="space-y-2">
                  <UnitBasedInput
                    control={control}
                    name="quantity"
                    label="Quantity *"
                    units={inventoryItem.units}
                    error={errors.quantity?.message}
                  />
                </div>
              </div>
            </div>

            <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-4 border-t px-0 flex-shrink-0 mt-6">
              <Button
                type="button"
                variant="outline"
                size={isMobile ? "lg" : "default"}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800"
                size={isMobile ? "lg" : "default"}
                disabled={isCreatingStockEntry || isFormSubmitting}
              >
                {isCreatingStockEntry || isFormSubmitting
                  ? "Adding..."
                  : "Add Stock"}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
