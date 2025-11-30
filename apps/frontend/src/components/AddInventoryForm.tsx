import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";
import { UnitGroupingBuilder } from "./UnitGroupingBuilder";
import {
  InventoryItem,
  InventoryType,
  InventoryStatus,
  UnitLevel,
  UnitGrouping,
} from "@/types/inventory";
import {
  getDefaultGrouping,
  INVENTORY_CATEGORIES,
} from "@/lib/inventory-defaults";
import { storageService } from "@/lib/inventory-storage";

interface AddInventoryFormProps {
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

export function AddInventoryForm({ onClose, onSave }: AddInventoryFormProps) {
  const [inventoryType, setInventoryType] = useState<InventoryType>("Drug");
  const [name, setName] = useState("");

  // Initialize units synchronously with default grouping to prevent UI flash
  const getInitialUnits = () => {
    const defaultGrouping = getDefaultGrouping("Drug");
    return defaultGrouping.units;
  };

  const [units, setUnits] = useState<UnitLevel[]>(getInitialUnits);
  const [initialUnits, setInitialUnits] =
    useState<UnitLevel[]>(getInitialUnits);
  const [status, setStatus] = useState<InventoryStatus>("ready");

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  useEffect(() => {
    const defaultGrouping = getDefaultGrouping(inventoryType);
    setUnits(defaultGrouping.units);
    setInitialUnits(defaultGrouping.units);
  }, [inventoryType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || units.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    const baseUnit = getBaseUnit();

    if (!baseUnit) {
      alert("Please define at least one unit");
      return;
    }

    const grouping: UnitGrouping = {
      id: `grouping-${Date.now()}`,
      name: `${inventoryType} - ${units[0]?.name}`,
      units,
    };

    const item: InventoryItem = {
      id: `item-${Date.now()}`,
      name,
      description: "",
      category: "",
      inventoryType,
      groupingId: grouping.id,
      grouping: grouping,
      status,
      stocks: [],
    };

    // Save to local storage immediately
    storageService.saveItem(item);
    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-2xl font-bold">Create Inventory Item</h2>
            <div className="flex items-center gap-3">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as InventoryStatus)}
              >
                <SelectTrigger
                  className={`w-[120px] h-9 text-sm font-medium border-0 shadow-none ${
                    status === "ready"
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Paracetamol 500mg"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Category</Label>
                <Select
                  value={inventoryType}
                  onValueChange={(v) => setInventoryType(v as InventoryType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(INVENTORY_CATEGORIES).map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <UnitGroupingBuilder
              units={units}
              onChange={setUnits}
              initialUnits={initialUnits}
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800">
              Save Item
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
