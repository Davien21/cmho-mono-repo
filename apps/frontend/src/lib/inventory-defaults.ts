import { UnitGrouping, InventoryType } from "@/types/inventory";

// All unique units extracted from INVENTORY_CATEGORIES
export const PACKAGE_UNITS = {
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
    units: [PACKAGE_UNITS.pack, PACKAGE_UNITS.card, PACKAGE_UNITS.tablet],
  },
  Injection: {
    id: "injection",
    name: "Injection",
    units: [PACKAGE_UNITS.pack, PACKAGE_UNITS.bottle],
  },
  Syrup: {
    id: "syrup",
    name: "Syrup",
    units: [PACKAGE_UNITS.bottle],
  },
  Water: {
    id: "bottle",
    name: "Bottle",
    units: [PACKAGE_UNITS.bottle],
  },
  Consumable: {
    id: "consumable",
    name: "Consumable",
    units: [PACKAGE_UNITS.piece],
  },
} as const satisfies Record<string, UnitGrouping>;

// Hydrate preset grouping with runtime fields (quantity)
export function hydrateGrouping(grouping: UnitGrouping): UnitGrouping {
  const hydratedUnits = grouping.units.map((unit) => ({
    ...unit,
    quantity: "",
  }));

  return { ...grouping, units: hydratedUnits };
}

export function getDefaultGrouping(type: InventoryType): UnitGrouping {
  return hydrateGrouping(INVENTORY_CATEGORIES[type]);
}

// Extract all unique unit names from PACKAGE_UNITS
export function getPackageUnitNames(): string[] {
  return Object.values(PACKAGE_UNITS).map((unit) => unit.name);
}
