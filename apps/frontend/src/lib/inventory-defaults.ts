import { UnitLevel, InventoryCategory } from "@/types/inventory";

// Suppliers
export const SUPPLIERS = [
  { name: "MedSupply Nigeria Ltd" },
  { name: "PharmaCare Distributors" },
  { name: "HealthLine Logistics" },
  { name: "Global Medical Supplies" },
  { name: "Unity Pharmaceuticals" },
] as const;

// All unique units extracted from INVENTORY_CATEGORIES
export const INVENTORY_UNITS = {
  pack: { id: "pack", name: "Pack", plural: "Packs" },
  card: { id: "card", name: "Card", plural: "Cards" },
  tablet: { id: "tablet", name: "Tablet", plural: "Tablets" },
  bottle: { id: "bottle", name: "Bottle", plural: "Bottles" },
  piece: { id: "piece", name: "Piece", plural: "Pieces" },
} as const;

export const INVENTORY_CATEGORIES = {
  Drug: {
    id: "drug",
    name: "Drug",
    units: [INVENTORY_UNITS.pack, INVENTORY_UNITS.card, INVENTORY_UNITS.tablet],
  },
  Injection: {
    id: "injection",
    name: "Injection",
    units: [INVENTORY_UNITS.pack, INVENTORY_UNITS.bottle],
  },
  Syrup: {
    id: "syrup",
    name: "Syrup",
    units: [INVENTORY_UNITS.bottle],
  },
  Bottle: {
    id: "bottle",
    name: "Bottle",
    units: [INVENTORY_UNITS.bottle],
  },
  Consumable: {
    id: "consumable",
    name: "Consumable",
    units: [INVENTORY_UNITS.piece],
  },
} as const satisfies Record<
  string,
  { id: string; name: string; units: readonly UnitLevel[] }
>;

// Hydrate preset units with runtime fields (quantity)
export function hydrateUnits(units: readonly UnitLevel[]): UnitLevel[] {
  return units.map((unit) => ({ ...unit, quantity: "" }));
}

export function getDefaultUnits(type: InventoryCategory): UnitLevel[] {
  return hydrateUnits(INVENTORY_CATEGORIES[type].units);
}

// Extract all unique unit names from INVENTORY_UNITS
export function getPackageUnitNames(): string[] {
  return Object.values(INVENTORY_UNITS).map((unit) => unit.name);
}

/**
 * Returns the appropriate unit name (singular or plural) based on quantity
 * @param unit - The unit object containing name and plural properties
 * @param quantity - The quantity to check (number or string)
 * @returns The singular name if quantity is 1, otherwise the plural name
 */
export function formatUnitName(
  unit: UnitLevel | { name: string; plural: string },
  quantity: number | string
): string {
  const numQuantity =
    typeof quantity === "string" ? parseFloat(quantity) : quantity;

  // Use plural if quantity is not exactly 1 (including 0, negative, or any value != 1)
  return numQuantity === 1 ? unit.name : unit.plural;
}
