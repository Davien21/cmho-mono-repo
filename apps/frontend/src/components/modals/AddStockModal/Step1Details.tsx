import { Control, FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InventorySupplierSelect } from "@/components/InventorySupplierSelect";
import { MonthPickerInput } from "@/components/ui/month-picker-input";
import { Controller } from "react-hook-form";
import { formatUnitName } from "@/lib/utils";
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

interface IProfit {
  percent: string;
  amount: string;
}

interface Step1DetailsProps {
  control: Control<AddStockFormValues>;
  errors: FieldErrors<AddStockFormValues>;
  supplierId: string | null;
  supplierName: string | null;
  onSupplierChange: (supplier: { id: string; name: string } | null) => void;
  inventoryItem: InventoryItem;
  profit: IProfit;
}

const getProfitText = (profit: IProfit): string => {
  if (!profit.percent || !profit.amount) return "Unknown";
  return `${profit.percent}% (₦${profit.amount})`;
};

export function Step1Details({
  control,
  errors,
  supplierId,
  onSupplierChange,
  inventoryItem,
  profit,
}: Step1DetailsProps) {
  const getBaseUnit = () => {
    if (!inventoryItem) return null;
    const units = inventoryItem.units;
    return units.length > 0 ? units[units.length - 1] : null;
  };

  const baseUnit = getBaseUnit();

  return (
    <div className="space-y-4">
      {/* Supplier and Expiry Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inventory-supplier">Supplier (Optional)</Label>
          <InventorySupplierSelect
            id="inventory-supplier"
            value={supplierId}
            onChange={(supplier) => {
              onSupplierChange(
                supplier ? { id: supplier.id, name: supplier.name } : null
              );
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
                placeholder="Select expiry date"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="costPrice">
              Cost Price in ₦ (per{" "}
              {baseUnit ? formatUnitName(baseUnit, 1) : "unit"}) *
            </Label>
            <Controller
              name="costPrice"
              control={control}
              render={({ field }) => (
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...field}
                  placeholder="0.00"
                  required
                />
              )}
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
            <Controller
              name="sellingPrice"
              control={control}
              render={({ field }) => (
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  {...field}
                  placeholder="0.00"
                  required
                />
              )}
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
    </div>
  );
}
