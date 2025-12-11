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

export interface StockMovementInventoryItem {
  id: string;
  name: string;
}

export interface StockMovementPerformer {
  id: string;
  name: string;
}

export interface StockMovementPrices {
  costPrice: number;
  sellingPrice: number;
}

export interface StockMovementSupplier {
  id: string;
  name: string;
}

export interface StockMovement {
  id: string;
  inventoryItem: StockMovementInventoryItem;
  operationType: "add" | "reduce";
  supplier: StockMovementSupplier | null;
  prices: StockMovementPrices | null;
  expiryDate: string;
  quantityInBaseUnits: number;
  balance: number;
  performer: StockMovementPerformer;
  createdAt: string;
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
  currentStockInBaseUnits?: number;
  earliestExpiryDate?: string | null;
  image?: InventoryItemImage;
  canBeSold?: boolean;
}
