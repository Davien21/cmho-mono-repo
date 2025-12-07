export const ActivityTypes = {
  // Stock operations
  ADD_STOCK: "add_stock",
  REDUCE_STOCK: "reduce_stock",

  // Inventory item operations
  CREATE_INVENTORY_ITEM: "create_inventory_item",
  UPDATE_INVENTORY_ITEM: "update_inventory_item",
  DELETE_INVENTORY_ITEM: "delete_inventory_item",

  // Category operations
  CREATE_INVENTORY_CATEGORY: "create_inventory_category",
  UPDATE_INVENTORY_CATEGORY: "update_inventory_category",
  DELETE_INVENTORY_CATEGORY: "delete_inventory_category",

  // Unit operations
  CREATE_INVENTORY_UNIT: "create_inventory_unit",
  UPDATE_INVENTORY_UNIT: "update_inventory_unit",
  DELETE_INVENTORY_UNIT: "delete_inventory_unit",

  // Supplier operations
  CREATE_SUPPLIER: "create_supplier",
  UPDATE_SUPPLIER: "update_supplier",
  DELETE_SUPPLIER: "delete_supplier",

  // Gallery operations
  CREATE_GALLERY_ITEM: "create_gallery_item",
  UPDATE_GALLERY_ITEM: "update_gallery_item",
  DELETE_GALLERY_ITEM: "delete_gallery_item",

  // Admin operations
  CREATE_ADMIN: "create_admin",
  UPDATE_ADMIN: "update_admin",
  DISABLE_ADMIN: "disable_admin",
} as const;

export type ActivityType = (typeof ActivityTypes)[keyof typeof ActivityTypes];
