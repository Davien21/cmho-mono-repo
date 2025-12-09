# TODO List

## UI/UX Improvements

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

4. **Determine if users should be allowed to modify packaging structure after category selection**

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

5. **Migrate inventory modals to use context-based approach**

- **Current state**: Inventory modals (AddInventoryModal, EditInventoryModal, UpdateStockModal) use props-based approach with local state management in InventoryPage
- **Goal**: Migrate to context-based modal system (like admin/employee modals) for consistency and better code organization
- **Benefits**:
  - Less boilerplate (no multiple useState calls in parent components)
  - No prop drilling (can open modals from anywhere - tables, dropdowns, buttons)
  - Consistent pattern across the app
  - Centralized modal management
- **Implementation steps**:
  - [ ] Add modal types to `ModalDataMap` in `apps/frontend/src/contexts/modal-context.tsx`:
    - `"add-inventory": undefined`
    - `"edit-inventory": InventoryItem`
    - `"update-stock": InventoryItem`
  - [ ] Update `AddInventoryModal` to use `useModalContext` instead of props
  - [ ] Update `EditInventoryModal` to use `useModalContext` instead of props
  - [ ] Update `AddStockModal` and `RemoveStockModal` to use `useModalContext` instead of props
  - [ ] Add all three modals to `apps/frontend/src/components/modals/index.tsx`
  - [ ] Update `InventoryPage` to use `openModal()` calls instead of local state
  - [ ] Remove local state management (`showAddForm`, `showEditModal`, `showStockModal`, `selectedItem`) from InventoryPage
  - [ ] Update any other components that open inventory modals to use context
  - [ ] Test all modal functionality (open, close, form submission, data passing)
- **Note**: `ImagePickerModal` should remain props-based as it's a sub-modal used within other modals

9. **Make UnitGroupingBuilder select adjust to content size**

- Currently, the UnitDropdown components in UnitGroupingBuilder use a fixed width (`w-24` = 96px)
- This can cause issues with longer unit names being truncated or having too much empty space for shorter names
- [ ] Update UnitDropdown className in UnitGroupingBuilder to use dynamic width based on content
- [ ] Consider using `min-w-fit` or `w-auto` with appropriate min/max width constraints
- [ ] Ensure the select dropdown content also adjusts appropriately
- [ ] Test with various unit name lengths to ensure proper display
- [ ] Update both root unit and nested unit dropdowns in UnitGroupingBuilder

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

4. **Show modal on 401 error explaining user needs to login again**

- When the backend returns a 401 (Unauthorized) error, show a modal explaining that the user needs to login again with email and password to fix their session
- **Current state**: 401 errors may not be properly handled, potentially leaving users in an inconsistent authentication state
- **Goal**: Display a modal when receiving 401 errors that explains the user needs to login again with email and password to fix their session, without automatically forcing logout
- **Implementation requirements**:
  - [ ] Identify where API requests are made in the frontend (API client, axios instance, fetch wrapper, etc.)
  - [ ] Add global error interceptor/handler to catch 401 responses
  - [ ] When 401 is detected, show a modal (not force logout) that:
    - Explains the session has expired or become invalid
    - Instructs the user to login again with email and password to fix their session
    - Provides a button/link to navigate to the login page
    - Optionally allows the user to dismiss the modal (though they'll need to login to continue)
  - [ ] Design modal UI that is clear and user-friendly
  - [ ] Handle edge cases (multiple simultaneous 401s, preventing duplicate modals, etc.)
  - [ ] Test with expired tokens, invalid sessions, and other 401 scenarios
- **Files to update**:
  - Frontend API client/axios configuration - Add 401 error interceptor
  - Create or update modal component for session expiration message
  - Modal context/system - Add session expiration modal type
  - Login/authentication utilities - Handle modal display on 401

5. **Refactor activity tracking setup on the backend**

- **Current state**: Activity tracking implementation is messy with lots of boilerplate code, complex description builder logic, and inconsistent patterns across controllers
- **Problems**:
  - Excessive boilerplate code in every controller (getting admin from request, building activity data objects, calling trackActivity)
  - Complex and confusing description builder logic (`description-builder.ts`) with special handlers and field mappings
  - Inconsistent activity tracking patterns across different controllers
  - Manual description building in controllers (e.g., `buildUpdateDescription`, `extractChangesMetadata`)
  - Repetitive code for extracting admin info, building entities array, and formatting descriptions
- **Goal**: Create a standard, flexible, and clean approach that significantly reduces boilerplate code and simplifies activity tracking
- **Proposed solution**: Implement middleware-based activity tracking that runs after controllers to automatically handle activity recording
- **Implementation requirements**:
  - [ ] Design a flexible activity tracking middleware that can be applied to routes
  - [ ] Create a standardized way to extract activity metadata from request/response (admin, entities, changes, etc.)
  - [ ] Simplify or replace the description builder logic with a cleaner, more maintainable approach
  - [ ] Design middleware configuration options (activity type, module, entity extraction, description builder, etc.)
  - [ ] Implement middleware that runs after controller execution to capture response data and track activities
  - [ ] Support different activity types (create, update, delete, custom actions) through configuration
  - [ ] Handle edge cases (errors, partial updates, bulk operations)
  - [ ] Refactor existing controllers to use the new middleware approach
  - [ ] Remove or significantly simplify `description-builder.ts` utility
  - [ ] Ensure backward compatibility during migration
  - [ ] Test activity tracking across all modules (admins, inventory items, stock entries, suppliers, categories, units, etc.)
- **Benefits**:
  - Drastically reduced boilerplate code in controllers
  - Consistent activity tracking pattern across all modules
  - Easier to maintain and extend
  - Cleaner controller code focused on business logic
  - Centralized activity tracking logic
- **Files to update**:
  - Create new middleware: `apps/backend/src/middlewares/activity-tracking.ts` (or similar)
  - Refactor: `apps/backend/src/utils/description-builder.ts` (simplify or replace)
  - Update all controllers that use activity tracking:
    - `apps/backend/src/modules/admins/admins.controller.ts`
    - `apps/backend/src/modules/inventory-items/inventory-items.controller.ts`
    - `apps/backend/src/modules/stock-entries/stock-entries.controller.ts`
    - `apps/backend/src/modules/suppliers/suppliers.controller.ts`
    - `apps/backend/src/modules/inventory-categories/inventory-categories.controller.ts`
    - `apps/backend/src/modules/inventory-units/inventory-units.controller.ts`
    - Any other controllers with activity tracking

6. **Refine track activity metadata based on activity type**

- **Current state**: The `trackActivity` method accepts a generic `metadata` object with `[key: string]: any`, which allows any structure for any activity type. This can lead to inconsistencies and makes it unclear what metadata should be included for each activity type.
- **Goal**: Define type-specific metadata structures for each activity type to ensure consistency, type safety, and clarity about what information should be tracked for each activity.
- **Implementation requirements**:
  - [ ] Analyze all current activity types and identify what metadata is needed for each:
    - Stock operations (ADD_STOCK, REDUCE_STOCK): quantity, unit, previous quantity, new quantity, expiry date, etc.
    - Inventory item operations (CREATE, UPDATE, DELETE): fields changed, old values, new values, etc.
    - Category operations: category details, affected items count, etc.
    - Unit operations: unit details, conversion factors, etc.
    - Supplier operations: supplier details, contact information, etc.
    - Gallery operations: image details, file sizes, etc.
    - Admin operations: admin details, permissions, etc.
  - [ ] Create TypeScript interfaces/types for metadata structures for each activity type (or groups of related activity types)
  - [ ] Update `trackActivity` method signature to use discriminated unions or type parameters based on activity type
  - [ ] Update `IActivityRecord` interface to use typed metadata instead of generic `{ [key: string]: any }`
  - [ ] Update all controller calls to `trackActivity` to use the appropriate metadata structure for each activity type
  - [ ] Ensure backward compatibility during migration (consider gradual migration or type assertions)
  - [ ] Add validation to ensure required metadata fields are present for each activity type
  - [ ] Update activity tracking service to handle type-specific metadata structures
  - [ ] Document metadata requirements for each activity type
  - [ ] Test that all activity tracking calls provide correct metadata structures
- **Benefits**:
  - Type safety for metadata structures
  - Clear documentation of what metadata is expected for each activity type
  - Prevents inconsistent or missing metadata
  - Better IDE autocomplete and error detection
  - Easier to query and filter activities by metadata fields
- **Files to update**:
  - `apps/backend/src/modules/activity-tracking/activity-tracking.types.ts` - Add typed metadata interfaces
  - `apps/backend/src/modules/activity-tracking/activity-tracking.service.ts` - Update method signature to use typed metadata
  - `apps/backend/src/modules/activity-tracking/activity-tracking.model.ts` - Update model if needed
  - All controllers that call `trackActivity` - Update to use typed metadata structures

## Documentation

8. **Create a tutorial library for the entire project**

- **Goal**: Build a comprehensive tutorial library that helps users understand and navigate the entire application
- **Scope**: Cover all major features, workflows, and modules across both the salary manager and inventory manager applications
- **Implementation requirements**:
  - [ ] Identify all key features and workflows that need tutorials (inventory management, stock operations, employee management, salary processing, etc.)
  - [ ] Design tutorial system architecture (onboarding flow, interactive guides, tooltips, help documentation)
  - [ ] Choose tutorial library/framework (e.g., React Joyride, Shepherd.js, Intro.js, or custom solution)
  - [ ] Create tutorial content for each major feature:
    - [ ] Inventory management (adding items, updating stock, managing categories/units/suppliers)
    - [ ] Stock operations (adding stock, reducing stock, viewing stock entries)
    - [ ] Employee management (adding employees, processing payments)
    - [ ] Admin management (creating admins, managing permissions)
    - [ ] Gallery management
    - [ ] Activity tracking and notifications
  - [ ] Implement tutorial UI components (progress indicators, skip/resume functionality, navigation)
  - [ ] Add tutorial triggers (first-time user onboarding, contextual help buttons, feature discovery)
  - [ ] Create tutorial persistence (track completed tutorials, allow users to replay tutorials)
  - [ ] Ensure tutorials work on both desktop and mobile views
  - [ ] Test tutorial flows across all major user journeys
  - [ ] Consider accessibility (keyboard navigation, screen reader support)
- **Files to create/update**:
  - Create tutorial configuration files
  - Create tutorial components (if using custom solution)
  - Update main app components to integrate tutorial system
  - Create tutorial content/data files
  - Update documentation with tutorial information
