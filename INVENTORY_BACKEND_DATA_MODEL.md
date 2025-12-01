## Inventory Backend Data Model

This document describes the database schemas required to move the inventory state from the frontend (localStorage) to the backend.

---

### 1. `inventory_items` Collection

Represents inventory items (drugs, injections, consumables, etc.) and their packaging structure.

- **Collection name**

  - `inventory_items`

- **Document shape**

  - **`_id`**: ObjectId

    - Primary key.

  - **`name`**: string (required)

    - Example: `"Amoxicillin 500mg"`.

  - **`category`**: string (required)

    - Represents the item **category** and matches the frontend `InventoryCategory` (`"Drug" | "Injection" | "Syrup" | "Bottle" | "Consumable"`).
    - Used for grouping/filtering in the UI.

  - **`units`**: array of subdocuments (required)  
    Defines the item’s packaging hierarchy from largest → smallest (e.g. Pack → Card → Tablet).  
    Units are **embedded** in the inventory document, but each unit can optionally reference a central preset in `inventory_units`.

    - `units[].id`: string

      - Local identifier for this unit level on the item (e.g. UUID used by the UI).

    - `units[].presetId`: string (optional)

      - References `inventory_units.key` (e.g. `"pack"`, `"card"`, `"tablet"`).
      - Lets you know which preset this unit was originally based on, without making the item depend on future preset changes.

    - `units[].name`: string

      - Singular display name, e.g. `"Pack"`, `"Card"`, `"Tablet"`.
      - Denormalized from the preset at creation time so existing items keep stable labels even if presets change later.

    - `units[].plural`: string

      - Plural display name, e.g. `"Packs"`, `"Cards"`, `"Tablets"`.
      - Also denormalized from the preset at creation time.

    - `units[].quantity`: number (optional but recommended)
      - Conversion factor to the _next_ (child) unit in the array.
      - For a sorted array `[largest, ..., smallest]`, `quantity` says:
        - “1 of this unit = `quantity` of the next unit.”
      - Example (`["Pack", "Card", "Tablet"]`):
        - `Pack.quantity = 10` (10 cards per pack)
        - `Card.quantity = 10` (10 tablets per card)
        - `Tablet.quantity` can be omitted or set to `1`.

  - **`lowStockValue`**: number (optional)

    - Low stock threshold in **base units** (same as `StockEntry.quantityInBaseUnits`).
    - Used to trigger “low stock” indicators in the UI.

  - **`setupStatus`**: string enum (required)

    - `"draft"` | `"ready"`.
    - `"draft"`: item is being configured and not yet active.
    - `"ready"`: item is configured and ready for operational use.

  - **`status`**: string enum (required, default `"active"`)

    - `"active"` | `"disabled"` | `"deleted"`.
    - `"active"`: item can be used in new stock entries and appears in normal lists.
    - `"disabled"`: item is frozen for new activity (cannot be used in new stock entries) but remains visible in history and, optionally, filtered lists.
    - `"deleted"`: item is soft-deleted; normally hidden from the UI, but kept for data integrity/auditing.

  - **`createdBy`**: ObjectId (required)

    - References the admin/user who created the inventory item (e.g. `admins._id`).
    - Used for audit trails and attribution in the UI.

  - **`currentStockInBaseUnits`**: number (optional but very useful)

    - Denormalized running total of stock for this item.
    - Computed as the sum of all relevant `stock_entries.quantityInBaseUnits` (adds minus reduces).
    - Enables fast queries like “show items with low stock” without re-aggregating the entire history.

  - **`createdAt`**: Date

    - Creation timestamp (e.g., from Mongoose `timestamps: true`).

  - **`updatedAt`**: Date
    - Last update timestamp.

---

### 2. `stock_entries` Collection

Represents every stock change (add or reduce) for an item. This is the historical log used by:

- The global stock changes view (`StockChangesPage`).
- The per-item stock history page (`StockEntriesPage`).

- **Collection name**

  - `stock_entries`

- **Document shape**

  - **`_id`**: ObjectId

    - Primary key (replaces frontend `StockEntry.id`).

  - **`inventoryItemId`**: ObjectId (required)

    - Foreign key referencing `inventory_items._id`.
    - Connects this entry with its parent item.

  - **`operationType`**: string enum (required)

    - `"add"` | `"reduce"`.
    - `"add"` increases stock; `"reduce"` decreases stock.

  - **`supplier`**: object or null (optional)

    Represents the supplier used for this stock change. This is an embedded snapshot that also references the central `suppliers` collection.

    - `supplier.supplierId`: ObjectId

      - References `suppliers._id` (dynamic, reusable supplier).

    - `supplier.name`: string
      - Supplier name at the time of the transaction (e.g. `"MedSupply Nigeria Ltd"`).
      - Denormalized so historical entries keep a stable label even if the supplier is renamed or deactivated.

  - **`costPrice`**: number (required)

    - **Cost per 1 base unit** of the item, stored in the system’s base currency.
    - Total cost for this stock entry is `costPrice × quantityInBaseUnits`.

  - **`sellingPrice`**: number (required)

    - **Selling price per 1 base unit** of the item, in the same base currency as `costPrice`.
    - Any per-pack/per-card price is derived in the UI using the item’s unit hierarchy.

  - **`expiryDate`**: Date (required)

    - Expiry date of this batch, used for display and future logic (e.g. expiries reporting).
    - Frontend can send ISO strings; backend stores as Date.

  - **`quantityInBaseUnits`**: number (required)

    - Total quantity change expressed in **base units**.
    - Base unit = the **last** element in the corresponding item’s `units` array.
    - Example:
      - Units: `[Pack (10 cards), Card (10 tablets), Tablet]`
      - If you add 2 packs:
        - `quantityInBaseUnits = 2 * 10 * 10 = 200 (tablets)`
      - This aligns with the existing `StockQuantityBadge` conversion logic.

  - **`createdBy`**: ObjectId (required)

    - References the admin/user who recorded the stock change (e.g. `admins._id`).
    - The UI can resolve this to a display name when needed.

  - **`createdAt`**: Date

    - Time the stock change was recorded (replaces the current `createdAt: string`).

  - **`updatedAt`**: Date
    - Last modification time, if entries are editable.

- **Indexes**

  - **`{ inventoryItemId: 1, createdAt: -1 }`**

    - Efficient per-item history queries, sorted by most recent first.

  - **`{ createdAt: -1 }`**
    - Efficient global “recent stock changes” list.

---

### 3. `suppliers` Collection (Optional)

Currently, suppliers are a hard-coded constant in the frontend. If you want to manage suppliers dynamically or reuse them across entries:

- **Collection name**

  - `suppliers`

- **Document shape**

  - **`_id`**: ObjectId

    - Primary key.

  - **`name`**: string (required, unique)

    - Supplier name, e.g. `"MedSupply Nigeria Ltd"`, `"PharmaCare Distributors"`.

  - **`contactPhone`**: string (optional)

    - Phone number for this supplier.

  - **`contactEmail`**: string (optional)

    - Email contact.

  - **`address`**: string (optional)

    - Physical address or notes.

  - **`status`**: string enum (required, default `"active"`)

    - `"active"` | `"disabled"` | `"deleted"`.
    - `"active"`: supplier can be selected for new inventory items or stock entries.
    - `"disabled"`: supplier is blocked from new usage but remains visible in existing data and reports.
    - `"deleted"`: supplier is soft-deleted and hidden from normal UIs, but retained for referential integrity and auditing.

- **Integration with `stock_entries`**

  - Each stock entry embeds a `supplier` object:
    - `supplier.supplierId` points to `suppliers._id`.
    - `supplier.name` stores the supplier’s display name at the time of the transaction so history remains readable if the supplier record changes.

---

### 4. Config Collections (`inventory_units`, `inventory_categories`)

These collections are the **authoritative, admin-managed source of truth** for inventory types and unit presets. They replace the earlier hard-coded `INVENTORY_CATEGORIES` and `INVENTORY_UNITS` constants and are used to drive UI options and validation.

#### 4.1 `inventory_units` Collection

Represents the reusable “unit types” that admins can manage (e.g. `Pack`, `Card`, `Tablet`, `Bottle`, `Piece`).

- **Collection name**

  - `inventory_units`

- **Document shape**

  - **`_id`**: ObjectId
  - **`key`**: string (required, unique)

    - Short identifier, e.g. `"pack"`, `"card"`, `"tablet"`, `"bottle"`, `"piece"`.

  - **`name`**: string (required)

    - Singular display name, e.g. `"Pack"`.

  - **`plural`**: string (required)

    - Plural display name, e.g. `"Packs"`.

  - **`isDefault`**: boolean (optional)
    - Indicates that this unit preset is part of the core/default set.

#### 4.2 `inventory_categories` Collection

Represents the set of inventory categories (e.g. Drug, Injection, Syrup, Bottle, Consumable) that admins can manage and that are used as allowed values for `inventory_items.category`.

- **Collection name**

  - `inventory_categories`

- **Document shape**

  - **`_id`**: ObjectId

  - **`key`**: string (required, unique)

    - Identifier matching the frontend keys, e.g. `"Drug"`, `"Injection"`, `"Syrup"`, `"Bottle"`, `"Consumable"`.

  - **`slug`**: string (optional)

    - URL/DB-friendly identifier, e.g. `"drug"`, `"injection"`.

  - **`name`**: string (required)

    - Human-readable name displayed in the UI.

  - **`defaultUnitPresetIds`**: array of strings (optional)
    - Defines the default unit hierarchy when creating a new item of this category.
    - Example for Drug:
      - `["pack", "card", "tablet"]`
    - The frontend can use this to pre-populate `inventory_items.units` for newly created items.

---

### 5. `admins` Collection

Represents administrative users who can log into the system and perform actions such as stock updates.

- **Collection name**

  - `admins`

- **Document shape**

  - **`_id`**: ObjectId

    - Primary key.

  - **`name`**: string (required)

    - Display name for the admin (used in UI).

  - **`email`**: string (required, unique)

    - Login identifier and contact email.

  - **`passwordHash`**: string (required)

    - Hashed password (never store raw passwords).

  - **`roles`**: string[] (required)

    - Array of role identifiers, e.g. `["super_admin"]`, `["inventory_manager"]`.
    - Used for authorization checks.

  - **`status`**: string enum (required, default `"active"`)

    - `"active"`: admin can log in and perform actions.
    - `"inactive"`: admin is blocked from logging in, but kept for history references.
    - `"deleted"`: soft-deleted; hidden from normal UIs but retained so references (e.g. `stock_entries.performedBy`) stay valid.

  - **`createdAt`**: Date

    - Creation timestamp.

  - **`updatedAt`**: Date
    - Last update timestamp.

- **Integration with `stock_entries`**

  - `stock_entries.performedBy` is an `ObjectId` referencing `admins._id`.

---

### 6. Minimal vs Full Setup

- **Core schemas required for the inventory backend**

- `inventory_items`
- `stock_entries`
- `inventory_units`
- `inventory_categories`

- **Recommended additional schemas for better structure and flexibility**

  - `suppliers`
  - `admins`

This structure preserves all of your current frontend behavior (including `UnitLevel`, `StockEntry`, and `StockQuantityBadge` logic) while giving you a clean, queryable, backend-backed data model that admins can configure at runtime.
