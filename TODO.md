# TODO List

## UI/UX Improvements

1. **Switch date inputs to shadcn date picker with input**

   - Replace all date input fields with the "Picker with Input" component from [shadcn date-picker](https://ui.shadcn.com/docs/components/date-picker)
   - This provides a better UX with both manual input and calendar picker functionality
   - Files to update:
     - [ ] Identify all components using date inputs
     - [ ] Implement the date picker component
     - [ ] Replace existing date inputs with the new picker

2. **Align vertical spacing and style between inventory and stock modals**

   - [ ] Review spacing in AddInventoryModal, EditInventoryModal, and UpdateStockModal
   - [ ] Standardize padding, margins, and gap values across all modals
   - [ ] Ensure consistent styling for form fields, buttons, and layout

3. **Make inventory and stock modals use responsive modals**

   - [ ] Convert AddInventoryModal to use ResponsiveDialog component
   - [ ] Convert EditInventoryModal to use ResponsiveDialog component
   - [ ] Convert UpdateStockModal to use ResponsiveDialog component
   - [ ] Test mobile and desktop responsiveness

4. **Find a better way to present name of item in update stock modal**

   - [ ] Review current implementation in UpdateStockModal
   - [ ] Design better UI/UX for displaying item name
   - [ ] Implement improved item name presentation

5. **Update low stock value input UX to match quantity input pattern** - ✅

   - Currently, low stock value uses a simple number input in AddInventoryModal and EditInventoryModal
   - Should match the quantity input UX pattern from UpdateStockModal (multiple unit inputs with "+" separators)
   - [ ] Review quantity input implementation in UpdateStockModal
   - [ ] Design low stock value input with multiple unit inputs (similar to quantity section)
   - [ ] Update AddInventoryModal to use the new low stock value input pattern
   - [ ] Update EditInventoryModal to use the new low stock value input pattern
   - [ ] Ensure proper conversion to base units when saving
   - [ ] Test with different unit configurations

6. **Update lowStockValue yup schema to number and implement auto-conversion on blur**

   - **Current state**: `lowStockValue` in AddInventoryModal uses yup array schema (array of `{unitId, value}` objects), but backend expects a number (in base units)
   - **Goal**: Change yup schema to accept `lowStockValue` as a number and add auto-conversion logic
   - **Auto-conversion behavior**: When user inputs values in different units (e.g., [1 pack] when 1 pack = 4 cards and 1 card = 5 tablets), automatically normalize on blur:
     - Convert to base units and redistribute: [1 pack] → [0 cards] → [5 tablets] (1 pack = 4 cards = 20 tablets total)
     - On blur from any input field, normalize all unit inputs to show the most compact representation
   - **Question for Dr. Ubochi**: Validate if this auto-conversion behavior (forcing normalization) is better UX than letting users input whatever combination they want (e.g., [1 pack] + [2 cards] + [3 tablets] all at once)
   - [ ] Consult with Dr. Ubochi on auto-conversion vs free-form input UX
   - [ ] Update yup schema in AddInventoryModal to use `yup.number()` for `lowStockValue` instead of array
   - [ ] Update yup schema in EditInventoryModal to use `yup.number()` for `lowStockValue` (currently uses string)
   - [ ] Implement auto-conversion logic in UnitBasedInput component (or create wrapper) that:
     - Calculates total in base units from current inputs
     - Redistributes to show most compact representation (e.g., prefer higher units when possible)
     - Triggers on blur event for each input field
   - [ ] Handle edge cases (empty inputs, invalid values, zero values)
   - [ ] Test conversion logic with various unit configurations (e.g., 1 pack = 4 cards, 1 card = 5 tablets)
   - [ ] Ensure form submission converts unit inputs to base units number before sending to backend

7. **Explore and implement inventory item picture management**

   - Currently, inventory items don't have pictures
   - Need to explore the best approach for adding and managing pictures
   - Goal: Make it easy and efficient (avoid one-at-a-time upload stress)
   - Considerations to explore:
     - [ ] Research bulk image upload solutions (drag & drop multiple files, batch upload)
     - [ ] Determine storage solution (local storage, cloud storage like S3/Cloudinary)
     - [ ] Design image upload UI/UX (single vs bulk upload, preview, crop/resize)
     - [ ] Consider image optimization (compression, thumbnails, formats)
     - [ ] Plan data model changes (add image field to inventory items model)
     - [ ] Design API endpoints for image upload/management
     - [ ] Consider mobile experience (camera integration, mobile upload)
     - [ ] Plan for existing items (migration strategy, optional vs required)
   - [ ] Implement chosen solution

8. **Determine if users should be allowed to modify packaging structure after category selection**

   - **Current behavior**: When a user selects a category with predefined unit presets (packaging structure), the UnitGroupingBuilder component loads those presets
   - **Question for Dr. Ubochi**: Should users be allowed to modify the packaging structure (units, quantities, relationships) even after selecting a category that has a defined structure?
   - **Considerations**:
     - **Option A (Locked)**: Once category is selected, unit structure is locked and cannot be modified
       - Pros: Ensures consistency across items in same category, prevents errors, simpler UX
       - Cons: Less flexibility, may need to create new categories for edge cases
     - **Option B (Editable)**: Users can modify unit structure even after category selection
       - Pros: More flexibility, handles edge cases without creating new categories
       - Cons: Risk of inconsistency within same category, more complex validation, potential for errors
     - **Option C (Hybrid)**: Allow modification but with warnings/confirmations, or allow only certain types of modifications
   - [ ] Consult with Dr. Ubochi on whether packaging structure should be locked or editable after category selection
   - [ ] Based on decision, implement appropriate UI/UX:
     - [ ] If locked: Disable or hide UnitGroupingBuilder when category with presets is selected
     - [ ] If editable: Ensure clear indication that structure can be modified, consider adding warnings
     - [ ] If hybrid: Implement the chosen restrictions/warnings
   - [ ] Update AddInventoryModal and EditInventoryModal accordingly
   - [ ] Test with various category configurations

9. **Fix unit and categories edit mode**

   - Currently, units and categories use inline editing (forms appear directly in the list)
   - This may have UX issues or inconsistencies compared to the supplier edit mode (which uses a modal)
   - [ ] Review current inline edit implementation in UnitsSection and CategoriesSection
   - [ ] Compare with supplier edit mode (modal-based) to determine best approach
   - [ ] Fix any issues with the edit mode (validation, error handling, UX, etc.)
   - [ ] Consider consistency: Should all three (units, categories, suppliers) use the same edit pattern?
   - [ ] Test edit functionality thoroughly

10. **Improve text and icon sizes for better readability and mobile usability**

   - Text and icons should be larger and more readable, especially on mobile devices
   - Larger touch targets make it easier to click/tap on mobile
   - [ ] Review current text sizes across the application (especially in InventorySettingsPage and related components)
   - [ ] Review icon sizes (lucide-react icons, custom icons, etc.)
   - [ ] Increase font sizes for better readability on mobile
   - [ ] Increase icon sizes to match larger text and provide better touch targets
   - [ ] Ensure buttons and interactive elements have adequate padding for mobile tapping
   - [ ] Test on mobile devices to verify improved usability
   - [ ] Consider responsive sizing: larger on mobile, appropriate on desktop

## Backend Features

9. **Implement action tracking system**
   - Track every action that an admin takes on the platform
   - **Approach**: Explicit tracking in controllers/services (not middleware)
   - **Tracking rules**:
     - Only track successful actions (failed actions should not be tracked)
     - Only track mutations (POST, PUT, DELETE, PATCH) - do not track reads (GET requests)
     - Track actions after successful completion
   - **Data structure for each action record** (one record per affected entity):
     - Action name (e.g., "create_transfer", "update_inventory_item", "create_stock_entry")
     - Module name: Use frontend modules (`inventory`, `salary`, `admin`) - matches user-facing organization
     - Entity type (e.g., "transfer", "transaction", "employee", "inventory-item", "stock-entry") - the model/collection affected
     - Entity ID (the specific document ID that was affected) - each record tracks one entity's change
     - Operation ID (groups all actions that are part of one user operation - same for all related entities)
     - Admin ID (from authenticated user)
     - Metadata (JSON containing before/after states for this specific entity and action-specific data)
   - **Multi-entity action handling**:
     - Create one action record per affected entity (even if different entity types)
     - Link related actions using `operationId` (same ID for all entities in one operation)
     - Each record stores that entity's before/after state independently
     - Handles three scenarios:
       - Single entity: one record
       - Multiple same entity (bulk): multiple records with same `operationId` and `entityType`
       - Multiple different entities: multiple records with same `operationId` but different `entityType`s
     - Examples:
       - Single transfer: 3 records (transfer, transaction, employee) with same `operationId`
       - Bulk inventory update: N records (one per item) with same `operationId` and `entityType: 'inventory-item'`
       - Create stock entry: 2 records (stock-entry, inventory-item) with same `operationId`
   - **Revert functionality**:
     - Store before/after states in metadata for revertible actions
     - Revert operations are total (all-or-nothing) - find all records with same `operationId` and revert each
     - Some actions are non-revertible (e.g., bulk transfers/payments)
   - **Bulk transfers specific handling**:
     - Since not revertible, use single summary record approach
     - Store employees array in metadata with: `name`, `amount`, `employeeId` (for UI display without lookups)
     - Store `totalAmount` for the bulk operation
     - Entity type: "transfer" (bulk type)
     - Action: "initiate_bulk_transfers"
   - [ ] Design action tracking data model/schema (include: action, module, entityType, entityId, operationId, adminId, metadata, isRevertible, timestamps)
   - [ ] Create action tracking service with helper function `trackAction(action, module, entityType, entityId, metadata, options?)` and `trackOperation(operationId, actions[])` for multi-entity operations
   - [ ] Add database indexes on `operationId`, `entityType`, `entityId`, `adminId`, `module`, `action` for efficient querying
   - [ ] Implement transaction safety for multi-entity operation tracking (all records created atomically)
   - [ ] Add explicit tracking calls in controllers/services for key operations:
     - [ ] Inventory: create, update, delete items
     - [ ] Stock entries: create (tracks stock-entry + inventory-item update)
     - [ ] Employees: create, update, delete
     - [ ] Transfers: single (tracks transfer + transaction + employee update) and bulk (summary record)
     - [ ] Other modules as needed
   - [ ] Implement revert functionality (separate task or future enhancement)
