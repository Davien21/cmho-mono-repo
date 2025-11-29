import { InventoryItem, UnitGrouping } from '@/types/inventory';

const INVENTORY_KEY = 'hospital_inventory_items';
const GROUPINGS_KEY = 'hospital_unit_groupings';

export const storageService = {
  getItems(): InventoryItem[] {
    const data = localStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveItem(item: InventoryItem): void {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => i.id === item.id);

    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }

    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  },

  deleteItem(id: string): void {
    const items = this.getItems().filter(i => i.id !== id);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  },

  getGroupings(): UnitGrouping[] {
    const data = localStorage.getItem(GROUPINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveGrouping(grouping: UnitGrouping): void {
    const groupings = this.getGroupings();
    const existingIndex = groupings.findIndex(g => g.id === grouping.id);

    if (existingIndex >= 0) {
      groupings[existingIndex] = grouping;
    } else {
      groupings.push(grouping);
    }

    localStorage.setItem(GROUPINGS_KEY, JSON.stringify(groupings));
  },

  deleteGrouping(id: string): void {
    const groupings = this.getGroupings().filter(g => g.id !== id);
    localStorage.setItem(GROUPINGS_KEY, JSON.stringify(groupings));
  }
};

