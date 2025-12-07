export interface IActivityRecord {
  // Core identification
  type: string; // e.g., "add_stock", "create_inventory_item", "update_category"
  module: string; // "inventory", "salary", "admin"

  // Entities affected (max 3)
  entities: Array<{
    id: string; // MongoDB ObjectId
    name: string; // Model/collection name: "inventory-item", "category", "stock-entry"
  }>;

  // Admin information (denormalized for easy display)
  admin: {
    id: string; // MongoDB ObjectId
    name: string; // Denormalized name for quick display
  };

  // Pre-formatted description
  description: string; // e.g., "Added 50 units of Ethanol", "Created category Pharmaceuticals"

  // Flexible metadata (completely open for any activity-specific data)
  metadata: {
    [key: string]: any;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

