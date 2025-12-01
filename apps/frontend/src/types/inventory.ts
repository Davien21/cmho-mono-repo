// InventoryCategory is derived from INVENTORY_CATEGORIES keys in inventory-defaults.ts

import { INVENTORY_CATEGORIES } from "@/lib/inventory-defaults";

export interface UnitLevel {
  id: string;
  name: string;
  plural: string; // Optional, used in presets
  quantity?: number | string; // Runtime field for conversion factor (user input)
}

// Derive the InventoryCategory from the keys of INVENTORY_CATEGORIES
export type InventoryCategory = keyof typeof INVENTORY_CATEGORIES;

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
}
