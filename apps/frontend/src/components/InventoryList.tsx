import { useState } from "react";
import {
  Search,
  Package,
  MoreVertical,
  PackagePlus,
  Edit2,
  Trash2,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { InventoryItem, UnitLevel } from "@/types/inventory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface InventoryListProps {
  items: InventoryItem[];
  onUpdateStock: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

type DisplayMode = "full" | "skipOne" | "baseOnly";

export function InventoryList({
  items,
  onUpdateStock,
  onEdit,
  onDelete,
}: InventoryListProps) {
  const [search, setSearch] = useState("");
  // Track display mode per item
  const [displayModes, setDisplayModes] = useState<Map<string, DisplayMode>>(
    new Map()
  );

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch;
  });

  const getTotalStock = (item: InventoryItem): number => {
    if (!item.stocks || item.stocks.length === 0) return 0;
    return item.stocks.reduce(
      (sum, stock) => sum + stock.quantityInBaseUnits,
      0
    );
  };

  const getBaseUnitName = (item: InventoryItem): string => {
    const units = item.units || [];
    // Base unit is the last unit in the array
    const baseUnit = units.length > 0 ? units[units.length - 1] : null;
    return baseUnit?.name || "units";
  };

  const getSortedUnits = (units: UnitLevel[]) => {
    // Units are already in the correct order in the array
    return units;
  };

  const convertBaseUnitsToRepresentation = (
    item: InventoryItem,
    totalInBaseUnits: number,
    mode: DisplayMode
  ): string => {
    if (totalInBaseUnits === 0) return `0 ${getBaseUnitName(item)}`;

    const units = item.units || [];
    if (units.length === 0)
      return `${totalInBaseUnits} ${getBaseUnitName(item)}`;

    const sortedUnits = getSortedUnits(units);
    // Base unit is the last unit in the array
    const baseUnit = units.length > 0 ? units[units.length - 1] : null;

    // Mode C: Base unit only
    if (mode === "baseOnly") {
      return `${totalInBaseUnits} ${baseUnit?.name || "units"}`;
    }

    // Calculate unit multipliers (how many base units each unit represents)
    const unitMultipliers = new Map<string, number>();
    sortedUnits.forEach((unit, unitIndex) => {
      // Multiply all child unit quantities (units that come after this one)
      let multiplier = 1;
      for (let i = unitIndex + 1; i < sortedUnits.length; i++) {
        multiplier *= Number(sortedUnits[i].quantity) || 1;
      }
      unitMultipliers.set(unit.id, multiplier);
    });

    // Get units to use based on mode
    let unitsToUse = [...sortedUnits];
    if (mode === "skipOne" && sortedUnits.length > 1) {
      // Skip the top-level unit (pack in the example)
      unitsToUse = sortedUnits.slice(1);
    }

    // Convert to the representation
    let remaining = totalInBaseUnits;
    const result: { name: string; quantity: number }[] = [];

    unitsToUse.forEach((unit) => {
      const multiplier = unitMultipliers.get(unit.id) || 1;
      if (multiplier > 1) {
        const quantity = Math.floor(remaining / multiplier);
        if (quantity > 0) {
          result.push({ name: unit.name, quantity });
          remaining -= quantity * multiplier;
        }
      }
    });

    // Add remaining base units
    if (remaining > 0 && baseUnit) {
      result.push({ name: baseUnit.name, quantity: remaining });
    }

    return result.map((r) => `${r.quantity} ${r.name}`).join(", ");
  };

  const toggleDisplayMode = (itemId: string) => {
    setDisplayModes((prev) => {
      const newModes = new Map(prev);
      const current = newModes.get(itemId) || "full";
      let next: DisplayMode;

      if (current === "full") {
        next = "skipOne";
      } else if (current === "skipOne") {
        next = "baseOnly";
      } else {
        next = "full";
      }

      newModes.set(itemId, next);
      return newModes;
    });
  };

  const getDisplayMode = (itemId: string): DisplayMode => {
    return displayModes.get(itemId) || "full";
  };

  const getFormattedStock = (item: InventoryItem): string => {
    const total = getTotalStock(item);
    const mode = getDisplayMode(item.id);
    return convertBaseUnitsToRepresentation(item, total, mode);
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="border rounded-lg p-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No items found</p>
            <p className="text-sm">
              {search
                ? "Try adjusting your search"
                : "Add your first inventory item to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.inventoryType}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "ready" ? "success" : "secondary"
                      }
                      className={
                        item.status === "ready"
                          ? "bg-green-100 text-green-800 hover:bg-green-200 capitalize"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 capitalize"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">
                      Stock:{" "}
                      <span
                        className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => toggleDisplayMode(item.id)}
                        title="Click to toggle display format"
                      >
                        {getFormattedStock(item)}
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUpdateStock(item)}>
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Add Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(item)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Left
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {item.inventoryType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => toggleDisplayMode(item.id)}
                        title="Click to toggle display format"
                      >
                        {getFormattedStock(item)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          item.status === "ready" ? "success" : "secondary"
                        }
                        className={
                          item.status === "ready"
                            ? "bg-green-100 text-green-800 hover:bg-green-200 capitalize"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 capitalize"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onUpdateStock(item)}
                            >
                              <PackagePlus className="mr-2 h-4 w-4" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
