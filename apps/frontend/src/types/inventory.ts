export interface UnitLevel {
  id: string;
  name: string;
  quantity: number | string;
  parentId?: string;
}

export interface UnitGrouping {
  id: string;
  name: string;
  units: UnitLevel[];
  baseUnitId: string;
  createdAt?: string;
}

export type InventoryType = 'Drug' | 'Injection' | 'Syrup' | 'Bottle' | 'Equipment' | 'Custom';

export type InventoryStatus = 'draft' | 'ready';

export interface StockEntry {
  id: string;
  inventoryItemId: string;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate?: string;
  quantityInBaseUnits: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  inventoryType: InventoryType;
  customInventoryType?: string;
  groupingId: string;
  grouping: UnitGrouping;
  status: InventoryStatus;
  stocks?: StockEntry[];
}

