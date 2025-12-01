import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { storageService } from "@/lib/inventory-storage";
import { InventoryItem, StockEntry, UnitLevel } from "@/types/inventory";
import { formatUnitName, SUPPLIERS } from "@/lib/inventory-defaults";

interface UpdateStockModalProps {
  inventoryItemId: string;
  onClose: () => void;
  onSave: (stock: StockEntry) => void;
}

interface QuantityInput {
  unitId: string;
  value: string;
}

interface IProfit {
  percent: string;
  amount: string;
}

const getProfitText = (profit: IProfit): string => {
  if (!profit.percent || !profit.amount) return "Unknown";
  return `${profit.percent}% (₦${profit.amount})`;
};

export function UpdateStockModal({
  inventoryItemId,
  onClose,
  onSave,
}: UpdateStockModalProps) {
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(
    null
  );
  const [operationType, setOperationType] = useState<"add" | "reduce">("add");
  const [supplier, setSupplier] = useState<string | null>(null);
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantityInputs, setQuantityInputs] = useState<QuantityInput[]>([]);

  useEffect(() => {
    const items = storageService.getItems();
    const item = items.find((i) => i.id === inventoryItemId);
    if (item) {
      setInventoryItem(item);
      // Initialize quantity inputs for all units
      const sortedUnits = getSortedUnits(item.units);
      setQuantityInputs(
        sortedUnits.map((unit) => ({ unitId: unit.id, value: "0" }))
      );
      // Pre-fill with latest stock prices if available
      const latestStock = item.stocks?.[item.stocks.length - 1];
      if (latestStock) {
        setCostPrice(latestStock.costPrice.toString());
        setSellingPrice(latestStock.sellingPrice.toString());
        // Pre-fill supplier if available
        if (latestStock.supplier) {
          setSupplier(latestStock.supplier);
        }
      }
    }
  }, [inventoryItemId]);

  const getSortedUnits = (units: UnitLevel[]) => {
    // Units are already in the correct order in the array
    return units;
  };

  const getBaseUnit = () => {
    if (!inventoryItem) return null;
    const units = inventoryItem.units;
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : null;
  };

  const calculateTotalInBaseUnits = () => {
    if (!inventoryItem) return 0;

    const units = inventoryItem.units;
    let total = 0;

    units.forEach((unit, unitIndex) => {
      const input = quantityInputs.find((qi) => qi.unitId === unit.id);
      const qty = parseFloat(input?.value || "0");

      if (qty <= 0) return;
      // Calculate multiplier for this unit to base unit
      // Multiply all child unit quantities (units that come after this one)
      let multiplier = 1;
      for (let i = unitIndex + 1; i < units.length; i++) {
        multiplier *= Number(units[i].quantity) || 1;
      }

      total += qty * multiplier;
    });

    return total;
  };

  const updateQuantityInput = (unitId: string, value: string) => {
    setQuantityInputs((prev) =>
      prev.map((qi) => (qi.unitId === unitId ? { ...qi, value } : qi))
    );
  };

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
    if (!item.stocks || item.stocks.length === 0) return 0;
    return item.stocks.reduce(
      (sum, stock) => sum + stock.quantityInBaseUnits,
      0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inventoryItem) {
      alert("Inventory item not found");
      return;
    }

    if (!costPrice || !sellingPrice) {
      alert("Please fill in cost and selling prices");
      return;
    }

    if (!expiryDate) {
      alert("Please provide an expiry date");
      return;
    }

    const totalQuantity = calculateTotalInBaseUnits();
    if (totalQuantity <= 0) {
      alert("Please enter a quantity greater than 0");
      return;
    }

    // Check if reducing stock would result in negative stock
    if (operationType === "reduce") {
      const currentStock = getTotalStock(inventoryItem);
      if (totalQuantity > currentStock) {
        alert(
          `Cannot reduce stock by ${totalQuantity} units. Current stock is only ${currentStock} units.`
        );
        return;
      }
    }

    const stockEntry: StockEntry = {
      id: crypto.randomUUID(),
      inventoryItemId: inventoryItem.id,
      operationType,
      supplier,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      expiryDate: expiryDate,
      quantityInBaseUnits:
        operationType === "reduce" ? -totalQuantity : totalQuantity,
      createdAt: new Date().toISOString(),
      performedBy: "Admin",
    };

    // Update the inventory item with the new stock
    // Also update status to "ready" if it was in "draft"
    const updatedItem: InventoryItem = {
      ...inventoryItem,
      stocks: [...(inventoryItem.stocks || []), stockEntry],
      status: "ready", // Item becomes ready once it has stock
    };

    storageService.saveItem(updatedItem);
    onSave(stockEntry);
    onClose();
  };

  if (!inventoryItem) return <EmptyState />;

  const baseUnit = getBaseUnit();
  const sortedUnits = getSortedUnits(inventoryItem.units);
  const totalInBaseUnits = calculateTotalInBaseUnits();

  const profit = calculateProfit();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-2xl font-bold">Update Stock</h2>
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
                    setSupplier(null);
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
            {/* Supplier and Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier (Optional)</Label>
                <Select
                  value={supplier || undefined}
                  onValueChange={setSupplier}
                  disabled={operationType === "reduce"}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIERS.map((sup) => (
                      <SelectItem key={sup.name} value={sup.name}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
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
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
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
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
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
              <Label className="text-sm font-medium">Quantity *</Label>

              <div className="flex items-center gap-3 flex-wrap">
                {sortedUnits.map((unit, idx) => {
                  const input = quantityInputs.find(
                    (qi) => qi.unitId === unit.id
                  );
                  const inputValue = input?.value || "0";
                  const displayName = formatUnitName(unit, inputValue);

                  return (
                    <div key={unit.id} className="flex items-center gap-3">
                      {idx > 0 && (
                        <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
                          +
                        </span>
                      )}

                      <div className="flex items-center bg-neutral-100 rounded-md">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="-"
                          value={inputValue}
                          onChange={(e) =>
                            updateQuantityInput(unit.id, e.target.value)
                          }
                          className="w-14 text-sm border-0 bg-transparent py-1.5 pl-3 pr-2 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                        />
                        <span className="text-sm pr-3 text-foreground font-medium">
                          {displayName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalInBaseUnits > 0 && baseUnit && (
                <p className="text-sm text-muted-foreground">
                  Total:{" "}
                  <span className="font-medium text-foreground">
                    {totalInBaseUnits}{" "}
                    {formatUnitName(baseUnit, totalInBaseUnits)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800">
              {operationType === "add" ? "Add" : "Reduce"} Stock
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const EmptyState = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <p className="text-center">Inventory item not found</p>
      </Card>
    </div>
  );
};
