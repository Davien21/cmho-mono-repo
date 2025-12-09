import { useState, useEffect, useMemo, useCallback } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { InventoryItem } from "@/types/inventory";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import {
  useAddStockMutation,
  useGetInventoryItemsQuery,
  useGetStockMovementQuery,
} from "@/store/inventory-slice";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Step1Details } from "./AddStockModal/Step1Details";
import { Step2Quantity } from "./AddStockModal/Step2Quantity";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const { refetch: refetchItems } = useGetInventoryItemsQuery();
  const { refetch: refetchStockMovement } = useGetStockMovementQuery();
  const [addStock, { isLoading: isAddingStock }] = useAddStockMutation();

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
    trigger,
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
    setCurrentStep(1);
  }, [inventoryItem, reset, getInitialQuantity]);

  // Reset step when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
    }
  }, [open]);

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
      if (!expiryDate) {
        toast.error("Expiry date is required");
        return;
      }

      const payload = {
        inventoryItemId: inventoryItem.id,
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

      await addStock(payload).unwrap();

      await Promise.all([refetchItems(), refetchStockMovement()]);

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

  const profit = calculateProfit();

  const handleNextStep = async () => {
    const isValid = await trigger(["expiryDate", "costPrice", "sellingPrice"]);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  if (!inventoryItem) return null;

  const showSteps = isMobile;

  return (
    <ResponsiveDialog.Root open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content
          className={`max-w-[550px] w-full flex flex-col ${
            isMobile ? "max-h-[80vh]" : "max-h-[90vh]"
          }`}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <ResponsiveDialog.Header className="px-0 flex-shrink-0">
              <div className="flex items-start gap-3">
                {showSteps && currentStep === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousStep}
                    className="flex-shrink-0 mt-1 h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex-1 min-w-0">
                  <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                    Add Stock
                  </ResponsiveDialog.Title>
                  <p className="text-sm text-muted-foreground mt-1">
                    {inventoryItem.name}
                  </p>
                </div>
              </div>
            </ResponsiveDialog.Header>

            <div
              className={`${
                showSteps && currentStep === 2
                  ? "flex-1 min-h-0 mt-4"
                  : "flex-1 min-h-0 mt-6"
              } overflow-y-auto px-1`}
            >
              {showSteps ? (
                // Mobile: Show steps
                <>
                  {currentStep === 1 && (
                    <Step1Details
                      control={control}
                      errors={errors}
                      supplierId={supplierId}
                      supplierName={supplierName}
                      onSupplierChange={(supplier) => {
                        setSupplierId(supplier?.id ?? null);
                        setSupplierName(supplier?.name ?? null);
                      }}
                      inventoryItem={inventoryItem}
                      profit={profit}
                    />
                  )}
                  {currentStep === 2 && (
                    <Step2Quantity
                      control={control}
                      errors={errors}
                      inventoryItem={inventoryItem}
                    />
                  )}
                </>
              ) : (
                // Desktop: Show all fields
                <div className="space-y-4">
                  <Step1Details
                    control={control}
                    errors={errors}
                    supplierId={supplierId}
                    supplierName={supplierName}
                    onSupplierChange={(supplier) => {
                      setSupplierId(supplier?.id ?? null);
                      setSupplierName(supplier?.name ?? null);
                    }}
                    inventoryItem={inventoryItem}
                    profit={profit}
                  />
                  <Step2Quantity
                    control={control}
                    errors={errors}
                    inventoryItem={inventoryItem}
                  />
                </div>
              )}
            </div>

            <ResponsiveDialog.Footer
              className={`flex flex-row gap-3 pt-4 border-t px-0 flex-shrink-0 ${
                showSteps && currentStep === 2 ? "mt-4" : "mt-6"
              } ${showSteps && currentStep === 1 ? "justify-end" : ""}`}
            >
              {showSteps && currentStep === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-gray-900 hover:bg-gray-800 flex-1 sm:flex-initial flex items-center justify-center gap-2"
                    size="lg"
                    onClick={handleNextStep}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size={isMobile ? "lg" : "default"}
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 flex-1"
                    size={isMobile ? "lg" : "default"}
                    disabled={isAddingStock || isFormSubmitting}
                  >
                    {isAddingStock || isFormSubmitting
                      ? "Adding..."
                      : "Add Stock"}
                  </Button>
                </>
              )}
            </ResponsiveDialog.Footer>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
