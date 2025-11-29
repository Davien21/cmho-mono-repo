import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { storageService } from "@/lib/inventory-storage";
import { InventoryItem, StockEntry, UnitLevel } from "@/types/inventory";

interface AddStockModalProps {
  inventoryItemId: string;
  onClose: () => void;
  onSave: (stock: StockEntry) => void;
}

interface QuantityInput {
  unitId: string;
  value: string;
}

export function AddStockModal({
  inventoryItemId,
  onClose,
  onSave,
}: AddStockModalProps) {
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(
    null
  );
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantityInputs, setQuantityInputs] = useState<QuantityInput[]>([]);

  useEffect(() => {
    const items = storageService.getItems();
    const item = items.find((i) => i.id === inventoryItemId);
    if (item) {
      setInventoryItem(item);
      // Initialize quantity inputs for all units
      const sortedUnits = getSortedUnits(item.grouping.units);
      setQuantityInputs(
        sortedUnits.map((unit) => ({ unitId: unit.id, value: "0" }))
      );
      // Pre-fill with latest stock prices if available
      const latestStock = item.stocks?.[item.stocks.length - 1];
      if (latestStock) {
        setPurchasePrice(latestStock.purchasePrice.toString());
        setSellingPrice(latestStock.sellingPrice.toString());
      }
    }
  }, [inventoryItemId]);

  const getSortedUnits = (units: UnitLevel[]) => {
    return [...units].sort((a, b) => {
      const getDepth = (unit: UnitLevel): number => {
        if (!unit.parentId) return 0;
        const parent = units.find((u) => u.id === unit.parentId);
        return parent ? getDepth(parent) + 1 : 0;
      };
      return getDepth(a) - getDepth(b);
    });
  };

  const getBaseUnit = () => {
    if (!inventoryItem) return null;
    const units = inventoryItem.grouping.units;
    return units.find((u) => u.id === inventoryItem.grouping.baseUnitId);
  };

  const calculateTotalInBaseUnits = () => {
    if (!inventoryItem) return 0;
    
    const sortedUnits = getSortedUnits(inventoryItem.grouping.units);
    let total = 0;

    sortedUnits.forEach((unit) => {
      const input = quantityInputs.find((qi) => qi.unitId === unit.id);
      const qty = parseFloat(input?.value || "0");
      
      if (qty > 0) {
        // Calculate multiplier for this unit to base unit
        let multiplier = 1;
        let currentUnit = unit;
        
        while (currentUnit.parentId) {
          const parent = inventoryItem.grouping.units.find(
            (u) => u.id === currentUnit.parentId
          );
          if (!parent) break;
          multiplier *= Number(currentUnit.quantity);
          currentUnit = parent;
        }
        
        total += qty * multiplier;
      }
    });

    return total;
  };

  const updateQuantityInput = (unitId: string, value: string) => {
    setQuantityInputs((prev) =>
      prev.map((qi) => (qi.unitId === unitId ? { ...qi, value } : qi))
    );
  };

  const calculateMargin = () => {
    const purchase = parseFloat(purchasePrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    if (purchase === 0) return 0;
    return (((selling - purchase) / purchase) * 100).toFixed(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inventoryItem) {
      alert("Inventory item not found");
      return;
    }

    if (!purchasePrice || !sellingPrice) {
      alert("Please fill in purchase and selling prices");
      return;
    }

    const totalQuantity = calculateTotalInBaseUnits();
    if (totalQuantity <= 0) {
      alert("Please enter a quantity greater than 0");
      return;
    }

    const stockEntry: StockEntry = {
      id: `stock-${Date.now()}`,
      inventoryItemId: inventoryItem.id,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      expiryDate: expiryDate || undefined,
      quantityInBaseUnits: totalQuantity,
      createdAt: new Date().toISOString(),
    };

    // Update the inventory item with the new stock
    const updatedItem: InventoryItem = {
      ...inventoryItem,
      stocks: [...(inventoryItem.stocks || []), stockEntry],
    };

    storageService.saveItem(updatedItem);
    onSave(stockEntry);
    onClose();
  };

  if (!inventoryItem) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md p-6">
          <p className="text-center">Loading inventory item...</p>
        </Card>
      </div>
    );
  }

  const baseUnit = getBaseUnit();
  const sortedUnits = getSortedUnits(inventoryItem.grouping.units);
  const totalInBaseUnits = calculateTotalInBaseUnits();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-2xl font-bold">Update Stock</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {inventoryItem.name}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-8 p-0 bg-gray-100"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-700" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Pricing Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">
                  Purchase Price (per {baseUnit?.name}) *
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">
                  Selling Price (per {baseUnit?.name}) *
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

            {(purchasePrice || sellingPrice) && (
              <p className="text-sm text-muted-foreground">
                Margin:{" "}
                <span className="font-medium text-foreground">
                  {calculateMargin()}%
                </span>
              </p>
            )}

            {/* Quantity Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quantity</Label>
              
              <div className="flex items-center gap-3 flex-wrap">
                {sortedUnits.map((unit, idx) => {
                  const input = quantityInputs.find((qi) => qi.unitId === unit.id);
                  
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
                          value={input?.value || "0"}
                          onChange={(e) =>
                            updateQuantityInput(unit.id, e.target.value)
                          }
                          className="w-16 text-sm border-0 bg-transparent py-1.5 pl-3 pr-2 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                        />
                        <span className="text-sm pr-3 text-foreground font-medium">
                          {unit.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalInBaseUnits > 0 && baseUnit && (
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{totalInBaseUnits} {baseUnit.name}</span>
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800">
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

