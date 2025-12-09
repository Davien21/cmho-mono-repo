import { Control, FieldErrors } from "react-hook-form";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { InventoryItem } from "@/types/inventory";

interface QuantityInput {
  unitId: string;
  value: string;
}

interface AddStockFormValues {
  expiryDate?: Date;
  costPrice?: string;
  sellingPrice?: string;
  quantity: QuantityInput[];
}

interface Step2QuantityProps {
  control: Control<AddStockFormValues>;
  errors: FieldErrors<AddStockFormValues>;
  inventoryItem: InventoryItem;
}

export function Step2Quantity({
  control,
  errors,
  inventoryItem,
}: Step2QuantityProps) {
  return (
    <div className="space-y-2">
      <UnitBasedInput
        control={control}
        name="quantity"
        label="Quantity *"
        units={inventoryItem.units}
        error={errors.quantity?.message}
      />
    </div>
  );
}

