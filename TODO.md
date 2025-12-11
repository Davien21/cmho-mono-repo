# TODO List

## UI/UX Improvements

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

5. **Show all suppliers of an inventory item as an option in inventory item actions**

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

2. **Audit and optimize all models and service queries**

- **Goal**: Comprehensive review and optimization of all database models, schemas, and service queries across the entire backend
- **Current state**: As the application has grown, there may be opportunities for better normalization, denormalization, indexing, and query optimization that haven't been systematically reviewed
- **Scope**: Review all backend modules to identify optimization opportunities
- **Implementation requirements**:
  - [ ] Audit all database models and schemas:
    - [ ] Inventory items model
    - [ ] Stock entries model
    - [ ] Stock movement model
    - [ ] Transactions model
    - [ ] Suppliers model
    - [ ] Categories model
    - [ ] Units model
    - [ ] Admins/Employees model
    - [ ] Activity tracking model
    - [ ] Trigger notifications model
    - [ ] Gallery model
    - [ ] Any other models in the system
  - [ ] For each model, identify:
    - [ ] Fields that should be indexed for better query performance
    - [ ] Data that should be normalized (reduce redundancy, improve consistency)
    - [ ] Data that should be denormalized (improve query performance, reduce joins)
    - [ ] Relationships that need optimization (references, embedded documents, etc.)
    - [ ] Fields with missing validation or constraints
    - [ ] Unused or redundant fields that should be removed
  - [ ] Review all service queries:
    - [ ] Identify N+1 query problems
    - [ ] Find queries that could benefit from aggregation pipelines
    - [ ] Look for missing or ineffective indexes
    - [ ] Identify slow queries using profiling tools
    - [ ] Find opportunities to use projections to reduce data transfer
    - [ ] Review pagination implementations
    - [ ] Check for inefficient sorting or filtering operations
  - [ ] Create optimization plan with prioritized improvements
  - [ ] Implement optimizations in phases:
    - [ ] Phase 1: Critical performance improvements (indexes, N+1 fixes)
    - [ ] Phase 2: Schema normalization/denormalization changes (with migrations)
    - [ ] Phase 3: Query refactoring and cleanup
  - [ ] Create database migrations for schema changes
  - [ ] Add or update indexes for frequently queried fields
  - [ ] Benchmark query performance before and after optimizations
  - [ ] Document optimization decisions and trade-offs
  - [ ] Test data integrity after schema changes
- **Considerations**:
  - Balance between normalization (data consistency) and denormalization (query performance)
  - Consider read vs write patterns for each model
  - Plan for data migration and backward compatibility
  - Monitor database performance metrics
  - Consider impact on existing API contracts
- **Benefits**:
  - Improved query performance and response times
  - Better data consistency and integrity
  - Reduced database load and resource usage
  - Clearer data models and relationships
  - Better scalability for future growth

3. **Restrict deletions to super admin or inventory editor access**

- All deletion operations are now restricted to super admins or users with the INVENTORY_EDITOR role
- **Affected entities**: inventory items, categories, units, suppliers, gallery items
- **Implementation**:
  - [x] Create `requireSuperAdmin` middleware in authentication.ts
  - [x] Add `INVENTORY_EDITOR` role to AdminRole enum (backend and frontend)
  - [x] Apply `hasRole(AdminRole.INVENTORY_EDITOR)` middleware to all deletion routes:
    - [x] Inventory items deletion route
    - [x] Inventory categories deletion route
    - [x] Inventory units deletion route
    - [x] Suppliers deletion route
    - [x] Gallery items deletion route
- **Security**: Prevents accidental or unauthorized deletions while allowing designated editors to manage inventory and gallery

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

## Architecture

1. **Create packages/shared folder for all apps to use shared types and interfaces**

   - **Current state**: Apps currently have their own type definitions, which can lead to duplication and inconsistencies across frontend and backend. Analysis found **100+ duplicate type definitions** across the codebase.
   - **Goal**: Create a shared package that contains common types, interfaces, DTOs, and validation schemas that can be used by both frontend and backend applications
   - **Benefits**:

     - Single source of truth for shared types and interfaces
     - Reduced duplication of type definitions
     - Better type safety between frontend and backend
     - Easier to maintain and update shared data structures
     - Centralized validation schemas and DTOs
     - Eliminates type mismatches (e.g., Admin roles: frontend uses `string[]` while backend uses `AdminRole[]`)

   - **Critical duplications found**:

     1. **Stock Movement Types**: `StockEntry` (frontend) vs `IStockMovement` (backend) - similar structures, different field names
     2. **Admin Types**: `IAdmin` duplicated with type mismatch - frontend has `roles: string[]`, backend has `roles: AdminRole[]`
     3. **Employee & Bank Types**: `IUserBank` (frontend) vs `IEmployeeBank` (backend) - identical structure, different names
     4. **API Response Types**: `IAPIResponse<T>` and `IAPIError` - duplicated EXACTLY in both apps
     5. **Inventory Categories**: `InventoryCategory` (frontend) vs `IInventoryCategory` (backend)
     6. **Unit Types**: `UnitLevel` (frontend) vs `IInventoryUnitDefinition` (backend)
     7. **Supplier Types**: Duplicated across frontend slice and backend types
     8. **Activity Tracking**: `IActivityRecordDto` (frontend) vs `IActivityRecord` (backend)
     9. **Common Enums**: `ESortOrder`, `AdminRole`, status enums scattered across files
     10. **Request DTOs**: 20+ request interfaces in `inventory-slice.ts` that mirror backend types

   - **Implementation requirements**:

     - [ ] Create `packages/shared` directory in the monorepo root
     - [ ] Set up TypeScript configuration for the shared package
     - [ ] Configure package.json with appropriate exports and build configuration
     - [ ] Identify and migrate common types/interfaces to shared package:
       - [ ] **API Response Types** (`packages/shared/types/common.ts`):
         - `IAPIResponse<T>` (currently in `apps/frontend/src/types/index.ts` and `apps/backend/src/lib/interfaces.ts`)
         - `IAPIError`
         - `IQueryMeta` (pagination metadata)
       - [ ] **Inventory Types** (`packages/shared/types/inventory.ts`):
         - `IInventoryItem` (merge frontend `InventoryItem` and backend `IInventoryItem`)
         - `IInventoryItemImage` (exists in both)
         - `InventoryStatus` enum
       - [ ] **Stock Movement Types** (`packages/shared/types/stock.ts`):
         - `IStockMovement` (unify `StockEntry` and backend `IStockMovement`)
         - `StockOperationType` type
         - Stock snapshot interfaces (`IStockSupplierSnapshot`, `IInventoryItemStockMovementSnapshot`, `IPerformerStockMovementSnapshot`, `IPriceStockMovementSnapshot`)
       - [ ] **Category Types** (`packages/shared/types/categories.ts`):
         - `IInventoryCategory` (merge frontend and backend versions)
         - `IInventoryCategoryUnitPresetPopulated`
         - `IInventoryCategoryWithUnitPresetsPopulated`
       - [ ] **Unit Types** (`packages/shared/types/units.ts`):
         - `IInventoryUnitDefinition` (merge `UnitLevel` and backend version)
         - `IInventoryUnitBase`, `IInventoryUnitDraft`, `IInventoryUnitReady`
       - [ ] **Supplier Types** (`packages/shared/types/suppliers.ts`):
         - `ISupplier`
         - `SupplierStatus` enum
       - [ ] **User/Admin Types** (`packages/shared/types/users.ts`):
         - `IAdmin` (fix type mismatch: standardize `roles` field)
         - `IEmployee` (merge `IUserBank` and `IEmployeeBank`)
         - `IEmployeeBank` / `IUserBank` (consolidate into one)
         - `IEmployeeWithBank`
         - `AdminStatus` enum
         - `AdminRole` enum (ensure consistent usage)
         - `IAdminLogin`
       - [ ] **Bank/Payment Types** (`packages/shared/types/payments.ts`):
         - `IBank`
         - `BankAccountVerificationResult`
         - `ITransfer`, `ITransaction`, `ITransferDetails`
         - `ITransactionStatus` enum
       - [ ] **Activity Tracking Types** (`packages/shared/types/activity.ts`):
         - `IActivityRecord` (merge frontend and backend)
         - `ActivityTypes` constants
         - `ActivityType` type
       - [ ] **Gallery Types** (`packages/shared/types/gallery.ts`):
         - `IGallery`
       - [ ] **Notification Types** (`packages/shared/types/notifications.ts`):
         - Notification interfaces from frontend and backend
       - [ ] **Media Types** (`packages/shared/types/media.ts`):
         - `IMediaDto` and related interfaces
       - [ ] **Common Enums** (`packages/shared/enums/index.ts`):
         - `ESortOrder` (currently duplicated)
         - `ETransferType`
         - All status enums
       - [ ] **Request/Response DTOs** (`packages/shared/dtos/`):
         - Inventory DTOs: `ICreateInventoryItemRequest`, `IUpdateInventoryItemRequest`
         - Category DTOs: `ICreateInventoryCategoryRequest`, `IUpdateInventoryCategoryRequest`, `IReorderInventoryCategoriesRequest`
         - Unit DTOs: `ICreateInventoryUnitRequest`, `IUpdateInventoryUnitRequest`, `IReorderInventoryUnitsRequest`
         - Supplier DTOs: `ICreateSupplierRequest`, `IUpdateSupplierRequest`
         - Stock DTOs: `IAddStockRequest`, `IReduceStockRequest`, `ICreateStockMovementRequest`
         - Admin DTOs: `IAddAdminRequest`, `IUpdateAdminRequest`
         - Employee DTOs: `IAddEmployeeRequest`, `IUpdateEmployeeRequest`
     - [ ] Create shared package structure:
       ```
       packages/shared/
       ├── types/
       │   ├── inventory.ts
       │   ├── stock.ts
       │   ├── users.ts
       │   ├── categories.ts
       │   ├── units.ts
       │   ├── suppliers.ts
       │   ├── activity.ts
       │   ├── gallery.ts
       │   ├── notifications.ts
       │   ├── media.ts
       │   ├── payments.ts
       │   └── common.ts
       ├── dtos/
       │   ├── inventory.dto.ts
       │   ├── admin.dto.ts
       │   ├── stock.dto.ts
       │   └── index.ts
       ├── enums/
       │   ├── status.enum.ts
       │   ├── roles.enum.ts
       │   └── index.ts
       ├── index.ts
       ├── package.json
       ├── tsconfig.json
       └── README.md
       ```
     - [ ] Move common types from frontend to packages/shared:
       - From `apps/frontend/src/types/index.ts` (IAPIResponse, IEmployee, IAdmin, etc.)
       - From `apps/frontend/src/types/inventory.ts` (all inventory types)
       - From `apps/frontend/src/store/inventory-slice.ts` (all DTO interfaces)
       - From `apps/frontend/src/store/admins-slice.ts` (admin request interfaces)
       - From `apps/frontend/src/store/activity-slice.ts`, `gallery-slice.ts`, `notifications-slice.ts`
     - [ ] Move common types from backend to packages/shared:
       - From `apps/backend/src/lib/interfaces.ts` (IAPIResponse, payment types)
       - From `apps/backend/src/modules/*/*.types.ts` files (all module types)
     - [ ] Update both frontend and backend to import from packages/shared
     - [ ] Configure build process to compile shared package before apps
     - [ ] Update import paths across all apps
     - [ ] Consider using path aliases for cleaner imports (e.g., `@shared/types`, `@shared/dtos`)
     - [ ] Add shared package to workspace dependencies in apps' package.json
     - [ ] Fix type mismatches during migration (e.g., Admin roles field)
     - [ ] Ensure ObjectId handling works for both apps (frontend uses strings, backend uses mongoose ObjectIds)
     - [ ] Test that both apps can properly import and use shared types
     - [ ] Update tsconfig paths if needed for monorepo resolution
     - [ ] Remove old type files after successful migration

   - **Files to create**:

     - `packages/shared/package.json`
     - `packages/shared/tsconfig.json`
     - `packages/shared/types/` - Type definitions (10+ files)
     - `packages/shared/dtos/` - Data Transfer Objects (5+ files)
     - `packages/shared/enums/` - Enums (2+ files)
     - `packages/shared/index.ts` - Main export file
     - `packages/shared/README.md` - Documentation

   - **Files to update**:
     - `apps/frontend/package.json` - Add shared package dependency
     - `apps/backend/package.json` - Add shared package dependency
     - `apps/frontend/src/types/index.ts` - Remove duplicated types
     - `apps/frontend/src/types/inventory.ts` - Remove (moved to shared)
     - `apps/frontend/src/store/inventory-slice.ts` - Update imports
     - `apps/frontend/src/store/admins-slice.ts` - Update imports
     - `apps/backend/src/lib/interfaces.ts` - Remove duplicated types
     - `apps/backend/src/modules/*/*.types.ts` - Remove or update to extend shared types
     - All files importing types (100+ files estimated)

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
