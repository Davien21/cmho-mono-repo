import { useState } from "react";
import {
  Search,
  Package,
  MoreHorizontal,
  PackagePlus,
  Edit2,
  Trash2,
  PackageOpen,
  Plus,
  Image as ImageIcon,
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
import { formatUnitName } from "@/lib/utils";
import { InventoryQtyLevelBadge } from "@/components/InventoryQtyLevelBadge";

interface InventoryListProps {
  items: InventoryItem[];
  onUpdateStock: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onViewStockEntries: (item: InventoryItem) => void;
  onAddItem: () => void;
  onImageClick?: (item: InventoryItem) => void;
}

type DisplayMode = "full" | "skipOne" | "baseOnly";

export function InventoryList({
  items,
  onUpdateStock,
  onEdit,
  onDelete,
  onViewStockEntries,
  onAddItem,
  onImageClick,
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
    return item.currentStockInBaseUnits ?? 0;
  };

  const getBaseUnitName = (
    item: InventoryItem,
    quantity: number = 2
  ): string => {
    const units = item.units || [];
    // Base unit is the last unit in the array
    const baseUnit = units.length > 0 ? units[units.length - 1] : null;
    if (!baseUnit) return "units";
    return formatUnitName(baseUnit, quantity);
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
    if (totalInBaseUnits === 0) return `0 ${getBaseUnitName(item, 0)}`;

    const units = item.units || [];
    if (units.length === 0)
      return `${totalInBaseUnits} ${getBaseUnitName(item, totalInBaseUnits)}`;

    const sortedUnits = getSortedUnits(units);
    // Base unit is the last unit in the array
    const baseUnit = units.length > 0 ? units[units.length - 1] : null;

    // Mode C: Base unit only
    if (mode === "baseOnly") {
      return `${totalInBaseUnits} ${
        baseUnit ? formatUnitName(baseUnit, totalInBaseUnits) : "units"
      }`;
    }

    // Calculate unit multipliers (how many base units each unit represents)
    const unitMultipliers = new Map<string, number>();
    sortedUnits.forEach((unit, unitIndex) => {
      // Multiply all child unit quantities (units that come after this one)
      let multiplier = 1;
      for (let i = unitIndex + 1; i < sortedUnits.length; i++) {
        const qty = sortedUnits[i].quantity;
        // Only multiply if quantity is a valid number > 0
        if (qty !== undefined && qty > 0) {
          multiplier *= qty;
        }
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
    const result: { unit: UnitLevel; quantity: number }[] = [];

    unitsToUse.forEach((unit) => {
      const multiplier = unitMultipliers.get(unit.id) || 1;
      if (multiplier > 1) {
        const quantity = Math.floor(remaining / multiplier);
        if (quantity > 0) {
          result.push({ unit, quantity });
          remaining -= quantity * multiplier;
        }
      }
    });

    // Add remaining base units
    if (remaining > 0 && baseUnit) {
      result.push({ unit: baseUnit, quantity: remaining });
    }

    return result
      .map((r) => `${r.quantity} ${formatUnitName(r.unit, r.quantity)}`)
      .join(", ");
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

  const isLowStock = (item: InventoryItem): boolean => {
    if (!item.lowStockValue) return false;
    const currentStock = getTotalStock(item);
    return currentStock <= item.lowStockValue;
  };

  const getEarliestExpiry = (item: InventoryItem): string | null => {
    return item.earliestExpiryDate ?? null;
  };

  const isExpiringSoon = (item: InventoryItem): boolean => {
    const earliestExpiry = getEarliestExpiry(item);
    if (!earliestExpiry) return false;
    if (earliestExpiry === "ALL EXPIRED") return true;

    const expiryDate = new Date(earliestExpiry);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    return expiryDate <= threeMonthsFromNow;
  };

  const formatExpiryDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    if (dateString === "ALL EXPIRED") return "ALL EXPIRED";
    const date = new Date(dateString);
    // Format as "MMM YYYY" (e.g., "Mar 2024")
    return date.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
  };

  const handleImageClick = (item: InventoryItem) => {
    if (item.image?.url && onImageClick) {
      onImageClick(item);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-base sm:text-sm h-10 sm:h-9"
          />
        </div>
        <Button
          onClick={onAddItem}
          className="sm:flex-shrink-0 h-10 sm:h-9 px-4 sm:px-3 text-base sm:text-sm"
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="border rounded-lg p-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-16 w-16 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-xl sm:text-lg font-medium mb-1">
              No items found
            </p>
            <p className="text-base sm:text-sm">
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
                  <div className="flex items-start justify-between mb-3 gap-3">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(item)}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 sm:h-6 sm:w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm sm:text-xs text-gray-600 mt-1">
                        {item.inventoryCategory}
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-base sm:text-sm text-gray-500">
                        Stock:{" "}
                        <InventoryQtyLevelBadge
                          low={isLowStock(item)}
                          onClick={() => toggleDisplayMode(item.id)}
                          title="Click to toggle display format"
                        >
                          {getFormattedStock(item)}
                        </InventoryQtyLevelBadge>
                      </p>
                      <p className="text-base sm:text-sm text-gray-500">
                        Earliest Expiry:{" "}
                        <Badge
                          className={
                            getEarliestExpiry(item) === "ALL EXPIRED"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : getEarliestExpiry(item) === null
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : isExpiringSoon(item)
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                        >
                          {formatExpiryDate(getEarliestExpiry(item))}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 sm:h-8 sm:w-8 border-gray-300 hover:bg-gray-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onUpdateStock(item)}
                            className="text-base sm:text-sm py-2.5 sm:py-2"
                          >
                            <PackagePlus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                            Update Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onViewStockEntries(item)}
                            className="text-base sm:text-sm py-2.5 sm:py-2"
                          >
                            <PackageOpen className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                            View Stock Changes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(item)}
                            className="text-base sm:text-sm py-2.5 sm:py-2"
                          >
                            <Edit2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            className="text-red-600 focus:text-red-600 text-base sm:text-sm py-2.5 sm:py-2"
                          >
                            <Trash2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Image
                  </th>
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
                    Earliest Expiry
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
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(item)}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {item.inventoryCategory}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InventoryQtyLevelBadge
                        low={isLowStock(item)}
                        onClick={() => toggleDisplayMode(item.id)}
                        title="Click to toggle display format"
                      >
                        {getFormattedStock(item)}
                      </InventoryQtyLevelBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          getEarliestExpiry(item) === "ALL EXPIRED"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : getEarliestExpiry(item) === null
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : isExpiringSoon(item)
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }
                      >
                        {formatExpiryDate(getEarliestExpiry(item))}
                      </Badge>
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
                            <Button
                              variant="outline"
                              className="h-10 w-10 sm:h-8 sm:w-8 p-0 border-gray-300 hover:bg-gray-50"
                            >
                              <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onUpdateStock(item)}
                              className="text-base sm:text-sm py-2.5 sm:py-2"
                            >
                              <PackagePlus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                              Update Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onViewStockEntries(item)}
                              className="text-base sm:text-sm py-2.5 sm:py-2"
                            >
                              <PackageOpen className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                              View Stock Changes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEdit(item)}
                              className="text-base sm:text-sm py-2.5 sm:py-2"
                            >
                              <Edit2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-red-600 focus:text-red-600 text-base sm:text-sm py-2.5 sm:py-2"
                            >
                              <Trash2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
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
