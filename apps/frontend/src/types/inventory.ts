export interface UnitLevel {
  id: string;
  name: string;
  plural: string; // Optional, used in presets
  quantity?: number; // Runtime field for conversion factor (user input)
}

// InventoryCategory represents a human-readable category name, e.g. "Drug"
// This is now backend-driven (via `inventory_categories`) rather than hard-coded.
export type InventoryCategory = string;

export type InventoryStatus = "draft" | "ready";

export interface StockEntry {
  id: string;
  inventoryItemId: string;
  operationType: "add" | "reduce";
  supplier: string | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  quantityInBaseUnits: number;
  createdAt: string;
  performedBy?: string;
}

export interface InventoryItemImage {
  url: string;
  mediaId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  inventoryCategory: InventoryCategory;
  units: UnitLevel[];
  lowStockValue?: number;
  status: InventoryStatus;
  stocks?: StockEntry[];
  currentStockInBaseUnits?: number;
  earliestExpiryDate?: string | null;
  image?: InventoryItemImage;
  canBeSold?: boolean;
}
