# TODO List

## UI/UX Improvements

- **Current state**: Expiry date is stored and input as a full date (day, month, year)
- **Goal**: Change expiry date to only require month and year (no day selection)
- **Implementation requirements**:
  - [ ] Update frontend expiry date input in UpdateStockModal to use month/year picker (not full date)
  - [ ] Update backend schema/validators to accept month/year format (store as first day of month or use month/year fields)
  - [ ] Update stock entries model to handle month/year expiry dates
  - [ ] Update inventory items model if earliestExpiryDate needs to be month/year
  - [ ] Ensure date comparisons and logic work correctly with month/year format
  - [ ] Update any display components showing expiry dates to format as "MM/YYYY" or "Month YYYY"
- **Files to update**:
  - `apps/frontend/src/components/modals/UpdateStockModal.tsx` - Change date input to month/year picker
  - `apps/backend/src/modules/stock-entries/stock-entries.validators.ts` - Update validation schema
  - `apps/backend/src/modules/stock-entries/stock-entries.model.ts` - Consider schema changes if needed
  - `apps/backend/src/modules/stock-entries/stock-entries.service.ts` - Update date comparison logic
  - `apps/backend/src/modules/inventory-items/inventory-items.model.ts` - Update earliestExpiryDate handling

1. **Align vertical spacing and style between inventory and stock modals**

   - [ ] Review spacing in AddInventoryModal, EditInventoryModal, and UpdateStockModal
   - [ ] Standardize padding, margins, and gap values across all modals
   - [ ] Ensure consistent styling for form fields, buttons, and layout

2. **Find a better way to present name of item in update stock modal**

   - [ ] Review current implementation in UpdateStockModal
   - [ ] Design better UI/UX for displaying item name
   - [ ] Implement improved item name presentation

3. **Update lowStockValue yup schema to number and implement auto-conversion on blur**

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

4. **Explore and implement inventory item picture management** - ✅

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

5. **Determine if users should be allowed to modify packaging structure after category selection**

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

6. **Fix unit and categories edit mode**

- Currently, units and categories use inline editing (forms appear directly in the list)
- This may have UX issues or inconsistencies compared to the supplier edit mode (which uses a modal)
- [ ] Review current inline edit implementation in UnitsSection and CategoriesSection
- [ ] Compare with supplier edit mode (modal-based) to determine best approach
- [ ] Fix any issues with the edit mode (validation, error handling, UX, etc.)
- [ ] Consider consistency: Should all three (units, categories, suppliers) use the same edit pattern?
- [ ] Test edit functionality thoroughly

7. **Improve text and icon sizes for better readability and mobile usability** - ✅

- Text and icons should be larger and more readable, especially on mobile devices
- Larger touch targets make it easier to click/tap on mobile
- [x] Review current text sizes across the application (especially in InventorySettingsPage and related components)
- [x] Review icon sizes (lucide-react icons, custom icons, etc.)
- [x] Increase font sizes for better readability on mobile
- [x] Increase icon sizes to match larger text and provide better touch targets
- [x] Ensure buttons and interactive elements have adequate padding for mobile tapping
- [ ] Test on mobile devices to verify improved usability
- [x] Consider responsive sizing: larger on mobile, appropriate on desktop

8. **Make UnitGroupingBuilder select adjust to content size**

- Currently, the UnitDropdown components in UnitGroupingBuilder use a fixed width (`w-24` = 96px)
- This can cause issues with longer unit names being truncated or having too much empty space for shorter names
- [ ] Update UnitDropdown className in UnitGroupingBuilder to use dynamic width based on content
- [ ] Consider using `min-w-fit` or `w-auto` with appropriate min/max width constraints
- [ ] Ensure the select dropdown content also adjusts appropriately
- [ ] Test with various unit name lengths to ensure proper display
- [ ] Update both root unit and nested unit dropdowns in UnitGroupingBuilder

9. **Ensure category presets are prefilled when adding inventory items**

- When a user selects a category in AddInventoryModal, the category's unit presets (packaging structure) should be automatically prefilled in the UnitGroupingBuilder
- **Current state**: There is a useEffect that handles category changes, but it may not work correctly in all scenarios (e.g., when modal first opens, when categories load asynchronously, when switching between categories)
- [ ] Verify that category presets are properly prefilled when category is selected in AddInventoryModal
- [ ] Ensure presets are loaded correctly when modal first opens with a default category
- [ ] Handle edge cases: categories loading asynchronously, switching between categories, categories without presets
- [ ] Ensure initialUnits state is properly set when category presets are loaded
- [ ] Test with categories that have unitPresets vs categories that use unitPresetIds
- [ ] Verify that canBeSold checkbox is also prefilled from category settings
- [ ] Ensure lowStockValue is properly initialized when presets are loaded

10. **Make input in UnitBasedInput expand based on content**

- Currently, the number input in UnitBasedInput has a fixed width (`w-14` = 56px)
- This can cause issues with longer numbers being truncated or having too much empty space for shorter numbers
- [ ] Update the Input component in UnitBasedInput to dynamically adjust width based on content
- [ ] Consider using `min-w-fit` or `w-auto` with appropriate min/max width constraints
- [ ] Ensure the input expands smoothly as user types longer numbers
- [ ] Test with various number lengths to ensure proper display
- [ ] Maintain proper alignment with the unit label text

11. **Show all suppliers of an inventory item as an option in inventory item actions**

- Add a new action option in the inventory item actions dropdown menu to view all suppliers associated with an inventory item
- **Current state**: Inventory items have supplier information, but there's no easy way to view all suppliers for an item from the actions menu
- **Goal**: Add a "View Suppliers" or "Show Suppliers" action option that displays all suppliers for the selected inventory item
- **Implementation requirements**:
  - [ ] Add new action option in InventoryList component's dropdown menu
  - [ ] Determine how to display suppliers (modal, dialog, or inline view)
  - [ ] Fetch and display supplier information for the selected inventory item
  - [ ] Handle cases where an item has no suppliers or a single supplier
  - [ ] Consider if suppliers should be clickable/editable from this view
- **Files to update**:
  - `apps/frontend/src/components/InventoryList.tsx` - Add new dropdown menu item
  - `apps/frontend/src/pages/modules/inventory-manager/InventoryPage.tsx` - Add handler for viewing suppliers
  - Potentially create a new modal/component to display suppliers list

12. **Improve reordering unit/category experience on mobile** - ✅

- **Current state**: Units and categories use drag-and-drop reordering with a drag handle icon, which may be difficult to use on mobile devices
- **Goal**: Improve the mobile experience for reordering units and categories to make it easier and more intuitive on touch devices
- **Considerations**:
  - [ ] Increase drag handle touch target size for better mobile usability
  - [ ] Consider alternative mobile-friendly reordering methods (e.g., up/down arrow buttons, long-press to drag)
  - [ ] Improve visual feedback during dragging on mobile (better shadows, haptic feedback if available)
  - [ ] Prevent accidental page scrolling while dragging on mobile
  - [ ] Test touch interactions and ensure smooth dragging experience
  - [ ] Consider swipe gestures or other mobile-native interactions
- **Files to update**:
  - `apps/frontend/src/features/inventory-settings/InventorySettingsPage/units.tsx` - Improve ReorderableUnitItem mobile experience
  - `apps/frontend/src/features/inventory-settings/InventorySettingsPage/categories.tsx` - Improve ReorderableCategoryItem mobile experience

13. **Better design the app selection UI**

- **Current state**: AppSelectionPage has a basic design with two app cards in a grid layout
- **Goal**: Improve the visual design, layout, and user experience of the app selection page
- **Considerations**:
  - [ ] Review current design and identify areas for improvement (spacing, typography, colors, animations)
  - [ ] Consider modern design patterns for app selection/dashboard interfaces
  - [ ] Improve visual hierarchy and information architecture
  - [ ] Enhance hover states and interactions
  - [ ] Ensure responsive design works well on all screen sizes
  - [ ] Consider adding visual elements like illustrations, better gradients, or background patterns
  - [ ] Improve accessibility (contrast, focus states, keyboard navigation)
  - [ ] Consider adding app previews or additional context for each app
- **Files to update**:
  - `apps/frontend/src/pages/AppSelectionPage.tsx` - Redesign the app selection interface

14. **Change action buttons everywhere to match the one in inventory table**

- **Current state**: Different tables/components use inconsistent action button styles:
  - InventoryList uses: `variant="outline"` with `className="h-10 w-10 sm:h-8 sm:w-8 p-0 border-gray-300 hover:bg-gray-50"` and `MoreHorizontal` icon
  - AdminsTable uses: `variant="ghost"` with `className="h-8 w-8 p-0"` and `MoreVertical` icon
  - EmployeesTable uses: Separate buttons (Edit and Pay) instead of dropdown menu
  - SuppliersSection uses: `variant="ghost"` with `MoreVertical` icon
- **Goal**: Standardize all action buttons to match the inventory table pattern for consistency across the application
- **Reference pattern** (from InventoryList):
  - Button: `variant="outline"` with `className="h-10 w-10 sm:h-8 sm:w-8 p-0 border-gray-300 hover:bg-gray-50"`
  - Icon: `MoreHorizontal` (not `MoreVertical`)
  - Dropdown menu items: `className="text-base sm:text-sm py-2.5 sm:py-2"`
  - Icons in menu items: `className="mr-2 h-5 w-5 sm:h-4 sm:w-4"`
- **Implementation requirements**:
  - [ ] Update AdminsTable to use `variant="outline"` with proper styling and `MoreHorizontal` icon
  - [ ] Update AdminsTable dropdown menu items to use responsive text sizing (`text-base sm:text-sm py-2.5 sm:py-2`)
  - [ ] Update AdminsTable menu item icons to use responsive sizing (`h-5 w-5 sm:h-4 sm:w-4`)
  - [ ] Convert EmployeesTable to use dropdown menu pattern (instead of separate buttons)
  - [ ] Update EmployeesTable action button to match inventory table style
  - [ ] Update SuppliersSection to use `variant="outline"` with proper styling and `MoreHorizontal` icon
  - [ ] Check and update any other tables/components with action buttons (PaymentsTable, ListedPaymentsTable, GroupedPaymentsTable, RecentEmployeesTable, etc.)
  - [ ] Ensure mobile views also use consistent styling
  - [ ] Test all action buttons across different screen sizes
- **Files to update**:
  - `apps/frontend/src/components/tables/AdminsTable.tsx` - Update action button styling
  - `apps/frontend/src/components/tables/EmployeesTable.tsx` - Convert to dropdown menu pattern
  - `apps/frontend/src/features/inventory-settings/InventorySettingsPage/suppliers.tsx` - Update action button styling
  - `apps/frontend/src/components/tables/PaymentsTable.tsx` - Check and update if needed
  - `apps/frontend/src/components/tables/ListedPaymentsTable.tsx` - Check and update if needed
  - `apps/frontend/src/components/tables/GroupedPaymentsTable.tsx` - Check and update if needed
  - `apps/frontend/src/components/tables/RecentEmployeesTable.tsx` - Check and update if needed

15. **Automatically expand sidebar when moving from mobile back to desktop view**

- **Current state**: When transitioning from mobile view to desktop view, the sidebar stays hidden/collapsed instead of automatically expanding
- **Goal**: Automatically expand the sidebar when the viewport changes from mobile to desktop
- **Implementation requirements**:
  - [ ] Add a `useEffect` in `SidebarProvider` that watches for `isMobile` changes
  - [ ] When `isMobile` changes from `true` to `false` (mobile → desktop), automatically set `open` to `true` (expand sidebar)
  - [ ] Ensure this doesn't interfere with user's manual sidebar toggle preferences
  - [ ] Consider preserving the user's last desktop sidebar state (expanded/collapsed) when returning to desktop
  - [ ] Test the transition behavior when resizing browser window or rotating device
- **Files to update**:
  - `apps/frontend/src/components/ui/sidebar.tsx` - Add effect to handle mobile-to-desktop transition in `SidebarProvider`

16. **Use thumbnails for preview image cards and full images for preview modal**

- **Current state**: Preview image cards (e.g., GalleryCard) and the preview modal (ImagePreviewModal) both load full-size images, which can be slow and use unnecessary bandwidth
- **Goal**: Optimize image loading by using smaller thumbnail images for preview cards and only loading full-size images when the user opens the preview modal
- **Implementation requirements**:
  - [ ] Determine if backend/media service provides thumbnail URLs or if thumbnails need to be generated
  - [ ] Update GalleryCard component to use thumbnail URLs for the preview image
  - [ ] Update ImagePreviewModal to use full-size image URLs
  - [ ] Ensure thumbnail fallback to full image if thumbnail is not available
  - [ ] Consider lazy loading for thumbnails in grid views
  - [ ] Test performance improvements (faster page loads, reduced bandwidth usage)
- **Files to update**:
  - `apps/frontend/src/components/GalleryCard.tsx` - Use thumbnail URLs for preview images
  - `apps/frontend/src/components/ImagePreviewModal.tsx` - Use full-size image URLs
  - Backend/media service - Ensure thumbnail generation and URL provision (if not already available)

## Backend Features

1. **Implement action tracking system**

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

2. **Restrict deletions to super admin access only**

- All deletion operations for critical entities should be restricted to super admins only
- **Affected entities**: units, categories, suppliers, gallery items, inventory items
- **Implementation**:
  - [x] Create `requireSuperAdmin` middleware in authentication.ts
  - [x] Apply middleware to all deletion routes:
    - [x] Inventory units deletion route
    - [x] Inventory categories deletion route
    - [x] Suppliers deletion route
    - [x] Gallery items deletion route (also added authentication)
    - [x] Inventory items deletion route
- **Security**: Prevents accidental or unauthorized deletions of critical data

3. **Allow users to choose session duration for auth/login**

- Give users the ability to select how long their authentication/login session should last
- **Current state**: Session duration is likely fixed/hardcoded
- **Goal**: Allow users to choose from predefined session duration options (e.g., 1 hour, 1 day, 1 week, 1 month, "Remember me" for extended sessions)
- **Implementation requirements**:
  - [ ] Design UI component for session duration selection (dropdown/radio buttons) in login page
  - [ ] Define session duration options and their values (in seconds/milliseconds)
  - [ ] Update login/auth API to accept session duration preference
  - [ ] Update backend authentication service to use custom session duration when generating tokens/cookies
  - [ ] Update token/cookie expiration logic to respect user-selected duration
  - [ ] Ensure "Remember me" option (if implemented) uses extended session duration
  - [ ] Update session validation middleware to check expiration based on custom duration
  - [ ] Consider security implications of longer session durations
  - [ ] Test session expiration with different duration options
- **Files to update**:
  - `apps/frontend/src/pages/LoginPage.tsx` - Add session duration selector UI
  - `apps/backend/src/modules/auth/auth.controller.ts` - Accept session duration in login request
  - `apps/backend/src/modules/auth/auth.service.ts` - Implement custom session duration logic
  - `apps/backend/src/middlewares/authentication.ts` - Update session validation if needed
  - `apps/backend/src/utils/token.ts` - Update token generation to accept custom expiration

4. **Force logout on 401 error with "Please log in again" message**

- When the backend returns a 401 (Unauthorized) error, automatically force the user to log out and display a message
- **Current state**: 401 errors may not be properly handled, potentially leaving users in an inconsistent authentication state
- **Goal**: Automatically log out users when receiving 401 errors and show a clear message prompting them to log in again
- **Implementation requirements**:
  - [ ] Identify where API requests are made in the frontend (API client, axios instance, fetch wrapper, etc.)
  - [ ] Add global error interceptor/handler to catch 401 responses
  - [ ] When 401 is detected, clear authentication state (tokens, user data, etc.)
  - [ ] Redirect user to login page
  - [ ] Display toast/notification message: "Please log in again"
  - [ ] Ensure all authentication-related state is cleared (Redux store, localStorage, sessionStorage, cookies, etc.)
  - [ ] Handle edge cases (multiple simultaneous 401s, navigation during logout, etc.)
  - [ ] Test with expired tokens, invalid sessions, and other 401 scenarios
- **Files to update**:
  - Frontend API client/axios configuration - Add 401 error interceptor
  - Authentication store/slice - Add logout action that clears all auth state
  - Login/authentication utilities - Ensure proper cleanup on logout
  - Potentially add toast/notification component if not already present
