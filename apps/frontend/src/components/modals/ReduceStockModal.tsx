import { useEffect, useMemo, useCallback } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { formatUnitName, getRTKQueryErrorMessage } from "@/lib/utils";
import {
  useReduceStockMutation,
  useGetInventoryItemsQuery,
  useGetStockMovementQuery,
} from "@/store/inventory-slice";
import { toast } from "sonner";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useModalContext } from "@/contexts/modal-context";

interface QuantityInput {
  unitId: string;
  value: string;
}

const reduceStockSchema = yup.object({
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

type ReduceStockFormValues = {
  quantity: QuantityInput[];
};

export function ReduceStockModal() {
  const { modals, closeModal } = useModalContext();
  const modalState = modals["reduce-stock"];
  const open = modalState?.isOpen || false;
  const inventoryItem = modalState?.data;

  const isMobile = useMediaQuery("(max-width: 640px)");
  const { refetch: refetchItems } = useGetInventoryItemsQuery(
    {},
    {
      skip: !open,
    }
  );
  const { refetch: refetchStockMovement } = useGetStockMovementQuery(
    undefined,
    {
      skip: !open,
    }
  );
  const [reduceStock, { isLoading: isReducingStock }] =
    useReduceStockMutation();

  const getInitialQuantity = useCallback((): QuantityInput[] => {
    if (!inventoryItem) return [];
    const sortedUnits = inventoryItem.units;
    return sortedUnits.map((unit) => ({ unitId: unit.id, value: "0" }));
  }, [inventoryItem]);

  const {
    handleSubmit,
    watch,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<ReduceStockFormValues>({
    resolver: yupResolver(reduceStockSchema) as any,
    defaultValues: {
      quantity: getInitialQuantity(),
    },
  });

  // Reset form when inventoryItem changes
  useEffect(() => {
    if (!inventoryItem) return;
    const initialQuantity = getInitialQuantity();
    reset({ quantity: initialQuantity });
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

  const getTotalStock = (item: InventoryItem): number => {
    return item.currentStockInBaseUnits ?? 0;
  };

  const onSubmit = async (values: ReduceStockFormValues) => {
    if (!inventoryItem) return;

    const totalQuantity = calculateTotalInBaseUnits(values.quantity || []);

    // Check if reducing stock would result in negative stock
    const currentStock = getTotalStock(inventoryItem);
    if (totalQuantity > currentStock) {
      setError("quantity", {
        type: "manual",
        message: `This item has insufficient stock.`,
      });
      return;
    }

    clearErrors("quantity");

    try {
      const payload = {
        inventoryItemId: inventoryItem.id,
        supplier: null,
        quantityInBaseUnits: totalQuantity,
        costPrice: null,
        sellingPrice: null,
        expiryDate: null,
      };

      await reduceStock(payload).unwrap();

      await Promise.all([refetchItems(), refetchStockMovement()]);

      toast.success("Stock reduced successfully");
      closeModal("reduce-stock");
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to reduce stock. Please try again."
      );
      toast.error(message);
    }
  };

  const baseUnit = getBaseUnit();
  const currentStock = inventoryItem ? getTotalStock(inventoryItem) : 0;
  const quantityValues = watch("quantity") || [];
  const totalInBaseUnits = calculateTotalInBaseUnits(quantityValues);

  if (!inventoryItem) return null;

  return (
    <ResponsiveDialog.Root
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModal("reduce-stock")}
    >
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-[550px] w-full max-h-[90vh] flex flex-col border-red-200">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <ResponsiveDialog.Header className="px-0 flex-shrink-0">
              <div>
                <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                  Reduce Stock
                </ResponsiveDialog.Title>
                <p className="text-sm text-muted-foreground mt-1">
                  {inventoryItem.name}
                </p>
              </div>
            </ResponsiveDialog.Header>

            <div className="flex-1 min-h-0 overflow-y-auto px-1 mt-6">
              <div className="space-y-4">
                {/* Current Stock Display */}
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

                {/* Quantity Section */}
                <div className="space-y-2">
                  <UnitBasedInput
                    control={control}
                    name="quantity"
                    label="Quantity to Reduce *"
                    units={inventoryItem.units}
                    error={errors.quantity?.message}
                  />

                  {/* Warning for reduce operations */}
                  {totalInBaseUnits > 0 && (
                    <p className="text-sm text-muted-foreground">
                      After reduction:{" "}
                      <span
                        className={`font-medium ${
                          currentStock - totalInBaseUnits < 0
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {currentStock - totalInBaseUnits}{" "}
                        {baseUnit
                          ? formatUnitName(
                              baseUnit,
                              currentStock - totalInBaseUnits
                            )
                          : "units"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-4 border-t px-0 flex-shrink-0 mt-6">
              <Button
                type="button"
                variant="outline"
                size={isMobile ? "lg" : "default"}
                onClick={() => closeModal("reduce-stock")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800"
                size={isMobile ? "lg" : "default"}
                disabled={isReducingStock || isFormSubmitting}
              >
                {isReducingStock || isFormSubmitting
                  ? "Reducing..."
                  : "Reduce Stock"}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
