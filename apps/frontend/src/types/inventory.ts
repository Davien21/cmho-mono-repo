export interface UnitLevel {
  id: string; // ObjectId from inventory_units collection
  name: string;
  plural: string; // Optional, used in presets
  quantity?: number; // Runtime field for conversion factor (user input)
}

// InventoryCategory represents a category object with name and id
export interface InventoryCategory {
  _id: string;
  name: string;
}

export interface StockEntry {
  id: string;
  inventoryItemId: string;
  operationType: "add" | "reduce";
  supplier: string | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  quantityInBaseUnits: number;
  balance?: number;
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
  category: InventoryCategory;
  units: UnitLevel[];
  lowStockValue?: number;
  stocks?: StockEntry[];
  currentStockInBaseUnits?: number;
  earliestExpiryDate?: string | null;
  image?: InventoryItemImage;
  canBeSold?: boolean;
}
