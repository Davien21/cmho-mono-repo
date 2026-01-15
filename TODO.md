# Migration & Refactoring Roadmap

## Media & Gallery Consolidation
- [ ] **Backend: Gallery to Media Migration**
  - [ ] Migrate all existing `Gallery` records to the `Media` model using the `category` property.
  - [ ] Update Activity Tracking to reference `Media` directly instead of `Gallery`.
  - [ ] Deprecate and remove the `Gallery` module (model, service, controller, routes).
  - [ ] Add a `name` property to the `Media` model for better identification.
- [ ] **Frontend: Unified Media Logic**
  - [ ] **REFACTOR CRITICAL**: Remove re-implemented logic in `InventorySettingsPage/gallery.tsx` (e.g., `processInBatches`, `isSafari`, `tryNativeHeicConversion`) and import from `image-utils.ts`.
  - [ ] Create a reusable `useMediaManager` hook to handle fetching, selection, and filtering.
  - [ ] Extract shared components for Media/Gallery grids, selection overlays, and upload zones.
  - [ ] Update all features (Inventory Settings, Balance Sheet, etc.) to use the unified media logic.

## Balance Sheet Page Refactoring
- [ ] **Logic Extraction**
  - [ ] Move drag-and-drop state and handlers to a reusable hook (`useDragAndDrop`).
  - [ ] Abstract the "Upload -> Optimize -> Process" flow into a custom hook or service.
  - [ ] Simplify complex `useMemo` chains for filtering staged/fresh/unfinished items.
- [ ] **UI Cleanup**
  - [ ] Standardize the media grid layout with other gallery views.
  - [ ] Reduce component-level bloat by breaking down the 500+ line file into smaller sub-components.

## Upload & Image Processing Improvements
- [ ] **HEIC Upload Policy**
  - [ ] **Frontend**: Disable HEIC/HEIF uploads on non-Safari browsers.
  - [ ] **UX**: Implement a toast or alert informing the user to use Safari for HEIC uploads to ensure client-side optimization.
- [ ] **HEIC Filename Sanitization**
  - [ ] **Frontend**: Update `optimizeImage` in `image-utils.ts` to strictly remove `.heic`/`.heif` extensions when converting to WebP.
  - [ ] **Backend**: Update `uploadToCloud` in `cloudinary.ts` to ensure the stored `filename` matches the final `webp` format.
- [ ] **Shared Processing Logic**
  - [ ] Consolidate batch processing logic across frontend and backend to use standardized helpers.
  - [ ] Improve error handling and progress reporting for multi-file uploads.

## Inventory Balances to Stock Routes Migration
- [ ] **Backend: Consolidate Inventory Balances into Stock Movement**
  - [ ] Move all inventory balances API endpoints from `inventory-balances.router.ts` to `stock-movement.router.ts`.
  - [ ] Integrate `inventory-balances.controller.ts` logic into `stock-movement.controller.ts`.
  - [ ] Merge `inventory-balances.service.ts` functionality into `stock-movement.service.ts`.
  - [ ] Consolidate `inventory-balances.types.ts` into `stock-movement.types.ts`.
  - [ ] Update route paths and ensure backward compatibility or update frontend accordingly.
  - [ ] Deprecate and remove the `inventory-balances` module after successful migration.
- [ ] **Frontend: Update API Calls**
  - [ ] Update `inventory-balances-slice.ts` to point to new stock movement endpoints.
  - [ ] Update all components using inventory balances APIs (e.g., `BalanceStockPage.tsx`).
  - [ ] Test all inventory balance-related features to ensure functionality remains intact.

## Modal Management Improvements
- [ ] **Replace Nested `openModal` Calls with `updateModal`**
  - [ ] Search codebase for patterns where `openModal` is called inside another `openModal`'s `onConfirm`/`onCancel` handlers.
  - [ ] Refactor to use `updateModal` for partial state updates (e.g., loading states) instead of re-opening modals with duplicate props.
  - [ ] Remove unnecessary `onCancel: () => {}` props when `isLoading` is true (modal should handle this internally).
  - [ ] Standardize modal state management across all features.

## Rename AIInventoryBalanceItem to ScannedInventoryItemData
- [ ] **Backend Changes**
  - [ ] `inventory-balances.model.ts`: Rename model from `AIInventoryBalanceItem` to `ScannedInventoryItemData`
  - [ ] `inventory-balances.types.ts`: Rename `IAIInventoryBalanceItem` → `IScannedInventoryItemData` and `AIInventoryBalanceStatus` → `ScannedInventoryStatus`
  - [ ] `inventory-balances.service.ts`: Update all model and type references
  - [ ] `inventory-balances.controller.ts`: Update any type references
- [ ] **Frontend Changes**
  - [ ] `inventory-balances-slice.ts`: Rename `IAIInventoryBalanceItemDto` → `IScannedInventoryItemDataDto` and `AIInventoryBalanceStatus` → `ScannedInventoryStatus`
  - [ ] `BalanceStockPage.tsx`: Update comments and type references
  - [ ] `AIPreviewModal.tsx`: Update any type references
- [ ] **Testing**: Search for remaining `AIInventoryBalanceItem` references and test all balance sheet features

## General Bloat Reduction
- [ ] Identify and remove redundant RTK Query endpoints that overlap between Media and Gallery.
  - [ ] Audit `gallery-slice.ts` and `media-slice.ts` for duplicate functionality.
- [ ] Centralize "Select from Gallery" modal logic to avoid re-implementing `ImagePickerModal` state everywhere.
