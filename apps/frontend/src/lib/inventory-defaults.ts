import { InventoryType, UnitGrouping } from '@/types/inventory';

export const DEFAULT_GROUPINGS: Record<InventoryType, UnitGrouping | null> = {
  Drug: {
    id: 'default-drug',
    name: 'Drug Default',
    units: [
      { id: 'pack', name: 'Pack', quantity: 1, parentId: undefined },
      { id: 'card', name: 'Card', quantity: 10, parentId: 'pack' },
      { id: 'tablet', name: 'Tablet', quantity: 10, parentId: 'card' }
    ],
    baseUnitId: 'tablet',
  },
  Injection: {
    id: 'default-injection',
    name: 'Injection Default',
    units: [
      { id: 'pack', name: 'Pack', quantity: 1, parentId: undefined },
      { id: 'bottle', name: 'Bottle', quantity: 10, parentId: 'pack' }
    ],
    baseUnitId: 'bottle',
  },
  Syrup: {
    id: 'default-syrup',
    name: 'Syrup Default',
    units: [
      { id: 'bottle', name: 'Bottle', quantity: 1, parentId: undefined }
    ],
    baseUnitId: 'bottle',
  },
  Bottle: {
    id: 'default-bottle',
    name: 'Bottle Default',
    units: [
      { id: 'bottle', name: 'Bottle', quantity: 1, parentId: undefined }
    ],
    baseUnitId: 'bottle',
  },
  Equipment: null,
  Custom: null
};

export function getDefaultGrouping(type: InventoryType): UnitGrouping | null {
  return DEFAULT_GROUPINGS[type];
}

