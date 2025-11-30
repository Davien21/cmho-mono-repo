import { useState, useEffect } from "react";
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
  InventoryType,
  InventoryStatus,
  UnitLevel,
  UnitGrouping,
} from "@/types/inventory";
import { storageService } from "@/lib/inventory-storage";

interface EditInventoryModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

export function EditInventoryModal({
  item,
  onClose,
  onSave,
}: EditInventoryModalProps) {
  const [inventoryType, setInventoryType] = useState<InventoryType>(
    item.inventoryType
  );
  const [customInventoryType, setCustomInventoryType] = useState(
    item.customInventoryType || ""
  );
  const [name, setName] = useState(item.name);
  const [units, setUnits] = useState<UnitLevel[]>(item.grouping?.units || []);
  const [initialUnits] = useState<UnitLevel[]>(
    item.grouping?.units || []
  );
  const [status, setStatus] = useState<InventoryStatus>(item.status);

  const getBaseUnit = (): UnitLevel | undefined => {
    return units.find((u) => !units.some((unit) => unit.parentId === u.id));
  };

  // Update initial units when inventory type changes
  useEffect(() => {
    // We don't auto-reset units on type change in edit mode
    // User can manually modify them if needed
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

    // Update or create new grouping
    const grouping: UnitGrouping = {
      id: item.grouping?.id || `grouping-${Date.now()}`,
      name: `${inventoryType} - ${units[0]?.name}`,
      units,
      baseUnitId: baseUnit.id,
    };

    const updatedItem: InventoryItem = {
      ...item,
      name,
      inventoryType,
      customInventoryType:
        inventoryType === "Custom" ? customInventoryType : undefined,
      groupingId: grouping.id,
      grouping: grouping,
      status,
    };

    // Save to local storage
    storageService.saveItem(updatedItem);
    storageService.saveGrouping(grouping);

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
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
                    <SelectItem value="Drug">Drug</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                    <SelectItem value="Syrup">Syrup</SelectItem>
                    <SelectItem value="Bottle">Bottle</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {inventoryType === "Custom" && (
                  <Input
                    id="customType"
                    value={customInventoryType}
                    onChange={(e) => setCustomInventoryType(e.target.value)}
                    placeholder="Enter custom type"
                    className="mt-2"
                  />
                )}
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
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
