import { useState, useEffect, useMemo, useCallback } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
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

interface UpdateStockModalProps {
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

const createUpdateStockSchema = (operationType: "add" | "reduce") => {
  return yup.object({
    expiryDate: yup.string().when([], {
      is: operationType === "add",
      then: (schema) => schema.required("Expiry date is required"),
      otherwise: (schema) => schema.optional(),
    }),
    costPrice: yup.string().when([], {
      is: operationType === "add",
      then: (schema) =>
        schema
          .required("Cost price is required")
          .test(
            "is-valid-cost",
            "Cost price must be greater than 0",
            (value) => {
              const parsed = parseFloat(value ?? "");
              return !Number.isNaN(parsed) && parsed > 0;
            }
          ),
      otherwise: (schema) => schema.optional(),
    }),
    sellingPrice: yup.string().when([], {
      is: operationType === "add",
      then: (schema) =>
        schema
          .required("Selling price is required")
          .test(
            "is-valid-selling",
            "Selling price must be greater than 0",
            (value) => {
              const parsed = parseFloat(value ?? "");
              return !Number.isNaN(parsed) && parsed > 0;
            }
          ),
      otherwise: (schema) => schema.optional(),
    }),
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
          // Check if at least one input has a value greater than 0
          return quantityInputs.some((input) => {
            const qty = parseFloat(input.value || "0");
            return qty > 0;
          });
        }
      )
      .required("Quantity is required"),
  });
};

type UpdateStockFormValues = {
  expiryDate?: string;
  costPrice?: string;
  sellingPrice?: string;
  quantity: QuantityInput[];
};

const getProfitText = (profit: IProfit): string => {
  if (!profit.percent || !profit.amount) return "Unknown";
  return `${profit.percent}% (₦${profit.amount})`;
};

export function UpdateStockModal({
  inventoryItem,
  open,
  onOpenChange,
}: UpdateStockModalProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [localItem] = useState<InventoryItem | null>(inventoryItem);
  const [operationType, setOperationType] = useState<"add" | "reduce">("add");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const { refetch: refetchItems } = useGetInventoryItemsQuery();
  const { refetch: refetchStockEntries } = useGetStockEntriesQuery();
  const [createStockEntry, { isLoading: isCreatingStockEntry }] =
    useCreateStockEntryMutation();

  const getInitialQuantity = useCallback((): QuantityInput[] => {
    if (!localItem) return [];
    const sortedUnits = localItem.units;
    return sortedUnits.map((unit) => ({ unitId: unit.id, value: "0" }));
  }, [localItem]);

  const schema = useMemo(
    () => createUpdateStockSchema(operationType),
    [operationType]
  );

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<UpdateStockFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      expiryDate: "",
      costPrice: "",
      sellingPrice: "",
      quantity: getInitialQuantity(),
    },
  });

  const costPrice = watch("costPrice");
  const sellingPrice = watch("sellingPrice");

  // Reset form when operation type or localItem changes
  useEffect(() => {
    if (!localItem) return;
    const initialQuantity = getInitialQuantity();
    reset({
      expiryDate: "",
      costPrice: "",
      sellingPrice: "",
      quantity: initialQuantity,
    });
  }, [localItem, operationType, reset, getInitialQuantity]);

  const getBaseUnit = () => {
    if (!localItem) return null;
    const units = localItem.units;
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : null;
  };

  const calculateTotalInBaseUnits = useMemo(() => {
    return (quantityInputs: QuantityInput[]) => {
      if (!localItem) return 0;

      const units = localItem.units;
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
  }, [localItem]);

  const calculateProfit = (): IProfit => {
    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    if (cost === 0) return { percent: "0.0", amount: "0" };
    const profitAmount = selling - cost;
    const profitPercent = ((profitAmount / cost) * 100).toFixed(1);
    return {
      percent: profitPercent,
      amount: profitAmount.toFixed(2),
    };
  };

  const getTotalStock = (item: InventoryItem): number => {
    return item.currentStockInBaseUnits ?? 0;
  };

  const onSubmit = async (values: UpdateStockFormValues) => {
    if (!localItem) {
      alert("Inventory item not found");
      return;
    }

    const totalQuantity = calculateTotalInBaseUnits(
      (values.quantity || []) as QuantityInput[]
    );
    if (totalQuantity <= 0) {
      toast.error("Please enter a quantity greater than 0");
      return;
    }

    // Check if reducing stock would result in negative stock
    if (operationType === "reduce") {
      const currentStock = getTotalStock(localItem);
      if (totalQuantity > currentStock) {
        toast.error(
          `Cannot reduce stock by ${totalQuantity} units. Current stock is only ${currentStock} units.`
        );
        return;
      }
    }

    try {
      await createStockEntry({
        inventoryItemId: localItem.id,
        operationType,
        supplier:
          operationType === "reduce" || !supplierId || !supplierName
            ? null
            : {
                supplierId,
                name: supplierName,
              },
        costPrice:
          operationType === "reduce"
            ? undefined
            : parseFloat(values.costPrice || "0"),
        sellingPrice:
          operationType === "reduce"
            ? undefined
            : parseFloat(values.sellingPrice || "0"),
        expiryDate: operationType === "reduce" ? undefined : values.expiryDate,
        quantityInBaseUnits:
          operationType === "reduce" ? -totalQuantity : totalQuantity,
      }).unwrap();

      await Promise.all([refetchItems(), refetchStockEntries()]);

      const successMessage =
        operationType === "add"
          ? "Stock added successfully"
          : "Stock reduced successfully";
      toast.success(successMessage);
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update stock. Please try again.";
      toast.error(message);
    }
  };

  const baseUnit = getBaseUnit();
  const profit = calculateProfit();
  const currentStock = getTotalStock(localItem);
  const quantityValues = watch("quantity") || [];
  const totalInBaseUnits = calculateTotalInBaseUnits(quantityValues);

  if (!localItem) return null;

  return (
    <ResponsiveDialog.Root open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content
          className={`max-w-[550px] w-full max-h-[90vh] flex flex-col ${
            operationType === "reduce" ? "border-red-200" : ""
          }`}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <ResponsiveDialog.Header className="px-0 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                    Update Stock
                  </ResponsiveDialog.Title>
                  <p className="text-sm text-muted-foreground mt-1">
                    {inventoryItem.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={operationType}
                    onValueChange={(value) => {
                      const op = value as "add" | "reduce";
                      setOperationType(op);
                      // Supplier is only relevant when adding stock, so clear it when reducing
                      if (op === "reduce") {
                        setSupplierId(null);
                        setSupplierName(null);
                      }
                    }}
                  >
                    <SelectTrigger
                      className={`w-[140px] h-9 text-sm font-medium border-0 shadow-none ${
                        operationType === "add"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add Stock</SelectItem>
                      <SelectItem value="reduce">Reduce Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <ResponsiveDialog.Close asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-700" />
                    </Button>
                  </ResponsiveDialog.Close>
                </div>
              </div>
            </ResponsiveDialog.Header>

            <div className="flex-1 min-h-0 overflow-y-auto px-1">
              <div className="space-y-4">
            {/* Current Stock Display (prominent for reduce mode) */}
            {operationType === "reduce" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-900">
                    Current Stock:
                  </span>
                  <span className="text-lg font-bold text-red-900">
                    {currentStock}{" "}
                    {baseUnit
                      ? formatUnitName(baseUnit, currentStock)
                      : "units"}
                  </span>
                </div>
              </div>
            )}

            {/* Supplier and Expiry Date - Only show for Add */}
            {operationType === "add" && (
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
                  <Input
                    id="expiryDate"
                    type="date"
                    {...register("expiryDate")}
                    required
                  />
                  {errors.expiryDate?.message && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.expiryDate.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Section - Only show for Add */}
            {operationType === "add" && (
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
            )}

            {/* Quantity Section */}
            <div className="space-y-2">
              <UnitBasedInput
                control={control}
                name="quantity"
                label="Quantity *"
                units={localItem.units}
                error={errors.quantity?.message}
              />

              {/* Warning for reduce operations */}
              {operationType === "reduce" && totalInBaseUnits > 0 && (
                <p className="text-sm text-muted-foreground">
                  After reduction:{" "}
                  <span
                    className={`font-medium ${
                      currentStock - totalInBaseUnits < 0
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {Math.max(0, currentStock - totalInBaseUnits)}{" "}
                    {baseUnit
                      ? formatUnitName(
                          baseUnit,
                          Math.max(0, currentStock - totalInBaseUnits)
                        )
                      : "units"}
                  </span>
                </p>
              )}
            </div>
              </div>
            </div>

            <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-6 border-t px-0 flex-shrink-0">
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
                  ? operationType === "add"
                    ? "Adding..."
                    : "Reducing..."
                  : operationType === "add"
                  ? "Add Stock"
                  : "Reduce Stock"}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}

