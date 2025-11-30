import { InventoryItem } from '@/types/inventory';

const INVENTORY_KEY = 'hospital_inventory_items';

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
  }
};

