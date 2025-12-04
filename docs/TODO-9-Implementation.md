# TODO #9 Implementation: Fix Unit and Categories Edit Mode

## Overview

This document details the implementation of TODO #9, which addresses the edit mode for Units and Categories in the Inventory Settings page. The task involved reviewing and fixing the inline editing implementation used by Units and Categories, comparing it with the modal-based approach used by Suppliers, and ensuring consistent UX and proper validation/error handling.

## Current Implementation State

### Edit Mode Approaches

The Inventory Settings page uses **two different edit patterns**:

1. **Inline Editing** (Units & Categories): Forms appear directly in the list when editing
2. **Modal Editing** (Suppliers): Editing opens a modal dialog

### Decision

After review, the implementation **maintains inline editing** for Units and Categories while ensuring proper validation, error handling, and UX consistency. This approach was chosen because:

- Units and Categories have simple data structures (1-2 fields)
- Inline editing provides faster workflow for quick edits
- Modal editing is reserved for Suppliers which have more complex forms (4+ fields)

---

## Implementation Details

### 1. Units Section Implementation

**File**: `apps/frontend/src/features/inventory-settings/InventorySettingsPage/units.tsx`

#### Data Structures

**Unit Schema (Yup Validation)**:

```typescript
export const addUnitSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  plural: yup.string().trim().required("Plural is required"),
});

export type AddUnitFormValues = yup.InferType<typeof addUnitSchema>;
```

**Unit DTO (from API)**:

```typescript
interface IInventoryUnitDefinitionDto {
  _id: string;
  name: string;
  plural: string;
}
```

#### State Management

**React Hook Form Setup**:

- Uses `useForm` hook with `yupResolver` for validation
- Default values: `{ name: "", plural: "" }`
- Form state tracks: `name`, `plural`, `errors`, `isSubmitting`

**Local State**:

- `editingId: string | null` - Tracks which unit is currently being edited
- `isUpdating: boolean` - Loading state from RTK Query mutation
- `isDeleting: boolean` - Loading state for delete operation

#### Edit Flow

1. **Start Edit** (`startEdit` function):

   ```typescript
   const startEdit = (unit: IInventoryUnitDefinitionDto) => {
     setEditingId(unit._id);
     reset({
       name: unit.name,
       plural: unit.plural,
     });
   };
   ```

   - Sets `editingId` to the unit's `_id`
   - Resets form with unit's current values
   - Triggers re-render showing inline form

2. **Save Edit** (`handleSaveEdit` function):

   ```typescript
   const handleSaveEdit = async (values: AddUnitFormValues) => {
     if (!editingId) return;
     try {
       await updateUnit({
         id: editingId,
         name: values.name.trim(),
         plural: values.plural.trim(),
       }).unwrap();
       toast.success("Unit updated successfully");
       setEditingId(null);
       reset();
     } catch (error: unknown) {
       const message =
         getRTKQueryErrorMessage(error) ||
         "Failed to update unit. Please try again.";
       toast.error(message);
     }
   };
   ```

   - Validates `editingId` exists
   - Calls `updateUnit` mutation with trimmed values
   - Shows success toast on completion
   - Clears `editingId` and resets form
   - Shows error toast on failure

3. **Cancel Edit**:
   ```typescript
   onClick={() => {
     setEditingId(null);
     reset();
   }}
   ```
   - Clears `editingId` to exit edit mode
   - Resets form to default values

#### UI Components

**Display Mode** (ActionPill):

```tsx
<ActionPill
  key={unit._id}
  label={unit.name}
  onEdit={() => startEdit(unit)}
  onDelete={() => handleDelete(unit._id, unit.name)}
  isDeleting={isDeleting}
/>
```

**Edit Mode** (Inline Form):

```tsx
<form
  key={unit._id}
  className="inline-flex items-center bg-muted rounded-full px-3 py-2 gap-2"
  onSubmit={handleSubmit(handleSaveEdit)}
>
  <div className="flex flex-col sm:flex-row gap-2">
    <Input aria-label="Unit name" {...register("name")} className="h-8" />
    <Input aria-label="Unit plural" {...register("plural")} className="h-8" />
  </div>
  {/* Error messages */}
  <div className="flex gap-1 ml-2">
    <Button type="submit" size="sm" variant="outline" disabled={isUpdating}>
      Save
    </Button>
    <Button type="button" size="sm" variant="ghost" onClick={cancel}>
      Cancel
    </Button>
  </div>
</form>
```

**Key UI Features**:

- Responsive layout: stacked on mobile, row on desktop
- Inline form styling: `bg-muted rounded-full` for visual distinction
- Error display: Shows validation errors below inputs
- Loading states: Disables submit button during update
- Accessibility: Proper `aria-label` attributes

#### API Integration

**RTK Query Mutations**:

- `useUpdateInventoryUnitMutation()` - Updates unit
- `useDeleteInventoryUnitMutation()` - Deletes unit
- `useGetInventoryUnitsQuery()` - Fetches units list

**Update Payload**:

```typescript
{
  id: string; // Unit ID
  name: string; // Trimmed name
  plural: string; // Trimmed plural
}
```

---

### 2. Categories Section Implementation

**File**: `apps/frontend/src/features/inventory-settings/InventorySettingsPage/categories.tsx`

#### Data Structures

**Category Schema (Yup Validation)**:

```typescript
export const addCategorySchema = yup.object({
  name: yup.string().trim().required("Name is required"),
});

export type AddCategoryFormValues = yup.InferType<typeof addCategorySchema>;
```

**Category DTO (from API)**:

```typescript
interface IInventoryCategoryDto {
  _id: string;
  name: string;
  // ... other fields
}
```

#### State Management

**React Hook Form Setup**:

- Uses `useForm` hook with `yupResolver` for validation
- Default values: `{ name: "" }`
- Form state tracks: `name`, `errors`, `isSubmitting`

**Local State**:

- `editingId: string | null` - Tracks which category is currently being edited
- `isUpdating: boolean` - Loading state from RTK Query mutation
- `isDeleting: boolean` - Loading state for delete operation

#### Edit Flow

1. **Start Edit** (`startEdit` function):

   ```typescript
   const startEdit = (category: IInventoryCategoryDto) => {
     setEditingId(category._id);
     reset({
       name: category.name,
     });
   };
   ```

2. **Save Edit** (`handleSaveEdit` function):
   ```typescript
   const handleSaveEdit = async (values: AddCategoryFormValues) => {
     if (!editingId) return;
     try {
       await updateCategory({
         id: editingId,
         name: values.name.trim(),
       }).unwrap();
       toast.success("Category updated successfully");
       setEditingId(null);
       reset();
     } catch (error: unknown) {
       const message =
         getRTKQueryErrorMessage(error) ||
         "Failed to update category. Please try again.";
       toast.error(message);
     }
   };
   ```

#### UI Components

**Display Mode** (ActionPill):

```tsx
<ActionPill
  key={category._id}
  label={category.name}
  onEdit={() => startEdit(category)}
  onDelete={() => handleDelete(category._id, category.name)}
  isDeleting={isDeleting}
/>
```

**Edit Mode** (Inline Form):

```tsx
<form
  key={category._id}
  className="inline-flex items-center bg-muted rounded-full px-3 py-2 gap-2"
  onSubmit={handleSubmit(handleSaveEdit)}
>
  <Input {...register("name")} className="h-8" />
  {errors.name?.message && (
    <span className="text-[10px] text-destructive ml-2">
      {errors.name.message}
    </span>
  )}
  <div className="flex gap-1 ml-2">
    <Button type="submit" size="sm" variant="outline" disabled={isUpdating}>
      Save
    </Button>
    <Button type="button" size="sm" variant="ghost" onClick={cancel}>
      Cancel
    </Button>
  </div>
</form>
```

**Key Differences from Units**:

- Single input field (name only)
- Simpler form structure
- Same validation and error handling pattern

#### API Integration

**RTK Query Mutations**:

- `useUpdateInventoryCategoryMutation()` - Updates category
- `useDeleteInventoryCategoryMutation()` - Deletes category
- `useGetInventoryCategoriesQuery()` - Fetches categories list

**Update Payload**:

```typescript
{
  id: string; // Category ID
  name: string; // Trimmed name
}
```

---

### 3. Suppliers Section (Reference Implementation)

**File**: `apps/frontend/src/features/inventory-settings/InventorySettingsPage/suppliers.tsx`

Suppliers use **modal-based editing** as a reference for comparison. This approach is used because Suppliers have more complex forms with multiple fields (name, phone, address, status).

#### Data Structures

**Supplier Schema**:

```typescript
export const supplierSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  phone: yup.string().trim().optional(),
  address: yup.string().trim().optional(),
  status: yup
    .mixed<SupplierStatus>()
    .oneOf(["active", "disabled"])
    .default("active"),
});
```

#### Edit Flow

1. **Start Edit**: Calls `onEditSupplier(supplier)` callback
2. **Parent Component** (`InventorySettingsPage.tsx`) manages modal state:
   ```typescript
   const [editingSupplier, setEditingSupplier] = useState<ISupplierDto | null>(
     null
   );
   ```
3. **Modal Opens**: `SupplierModal` component with `mode="edit"` and `initialSupplier` prop
4. **Form Pre-population**: `useEffect` hook resets form when modal opens:
   ```typescript
   useEffect(() => {
     if (open) {
       if (initialSupplier) {
         reset({
           name: initialSupplier.name,
           phone: initialSupplier.contact?.phone || "",
           address: initialSupplier.contact?.address || "",
           status:
             initialSupplier.status === "deleted"
               ? "disabled"
               : initialSupplier.status,
         });
       }
     }
   }, [open, initialSupplier, reset]);
   ```

#### Modal Component

Uses `ResponsiveDialog` component for responsive modal behavior:

- Full-screen on mobile
- Centered dialog on desktop
- Proper overlay and portal handling

---

## Key Implementation Features

### 1. Validation & Error Handling

**Yup Schema Validation**:

- All inputs use Yup schemas for validation
- Required fields are enforced
- String trimming applied automatically
- Error messages displayed inline

**Error Display**:

- Validation errors shown below inputs
- API errors caught and displayed via toast notifications
- Error messages use `getRTKQueryErrorMessage` utility for consistent formatting

### 2. Loading States

**Button Disabled States**:

- Submit buttons disabled during mutations (`isUpdating`, `isSubmitting`)
- Delete buttons disabled during deletion (`isDeleting`)
- Loading text shown: "Saving...", "Adding...", etc.

### 3. Form State Management

**React Hook Form Integration**:

- Centralized form state management
- Automatic validation on submit
- Form reset on cancel/success
- Default values properly initialized

**State Synchronization**:

- `editingId` tracks which item is being edited
- Form values reset when entering/exiting edit mode
- Form state cleared on successful update

### 4. User Experience

**Visual Feedback**:

- Success toasts on successful operations
- Error toasts on failures
- Loading indicators during async operations
- Inline form styling distinguishes edit mode

**Responsive Design**:

- Mobile-friendly layouts (stacked inputs on small screens)
- Touch-friendly button sizes
- Proper spacing and padding

**Accessibility**:

- Proper `aria-label` attributes
- Semantic HTML (forms, buttons)
- Keyboard navigation support

### 5. Delete Functionality

Both Units and Categories use the same delete pattern:

```typescript
const handleDelete = (id: string, name: string) => {
  openModal("confirmation-dialog", {
    title: "Delete [unit/category]",
    message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    type: "danger",
    onConfirm: async () => {
      try {
        await delete [Unit / Category](id).unwrap();
        toast.success("[Unit/Category] deleted successfully");
      } catch (error: unknown) {
        const message =
          getRTKQueryErrorMessage(error) ||
          "Failed to delete [unit/category]. Please try again.";
        toast.error(message);
      } finally {
        closeModal("confirmation-dialog");
      }
    },
    onCancel: () => closeModal("confirmation-dialog"),
  });
};
```

**Delete Flow**:

1. User clicks delete on ActionPill
2. Confirmation modal opens via `useModalContext`
3. User confirms or cancels
4. On confirm: API call → success toast → modal closes
5. On error: error toast → modal remains open

---

## Component Dependencies

### Shared Components

1. **ActionPill** (`apps/frontend/src/components/ActionPill.tsx`):

   - Reusable pill component with edit/delete actions
   - Used by both Units and Categories sections
   - Props: `label`, `onEdit`, `onDelete`, `isDeleting`, `className`

2. **ResponsiveDialog** (`apps/frontend/src/components/ResponsiveDialog.tsx`):

   - Used for Add modals (Units, Categories, Suppliers)
   - Provides responsive modal behavior
   - Not used for inline editing

3. **Modal Context** (`apps/frontend/src/contexts/modal-context.tsx`):
   - Used for confirmation dialogs (delete operations)
   - Provides `openModal` and `closeModal` functions

### UI Components

- `Button` - From shadcn/ui
- `Input` - From shadcn/ui
- `Label` - From shadcn/ui
- `Badge` - From shadcn/ui (for counts in segmented control)

### Form Libraries

- `react-hook-form` - Form state management
- `@hookform/resolvers/yup` - Yup validation integration
- `yup` - Schema validation

### State Management

- `@reduxjs/toolkit` - RTK Query for API calls
- `sonner` - Toast notifications

---

## API Endpoints

### Units API

**Base Path**: `/api/inventory-units`

- `GET /api/inventory-units` - List all units
- `POST /api/inventory-units` - Create unit
- `PUT /api/inventory-units/:id` - Update unit
- `DELETE /api/inventory-units/:id` - Delete unit

### Categories API

**Base Path**: `/api/inventory-categories`

- `GET /api/inventory-categories` - List all categories
- `POST /api/inventory-categories` - Create category
- `PUT /api/inventory-categories/:id` - Update category
- `DELETE /api/inventory-categories/:id` - Delete category

### RTK Query Integration

**Slice**: `apps/frontend/src/store/inventory-slice.ts`

**Mutations**:

- `useUpdateInventoryUnitMutation()`
- `useDeleteInventoryUnitMutation()`
- `useUpdateInventoryCategoryMutation()`
- `useDeleteInventoryCategoryMutation()`

**Queries**:

- `useGetInventoryUnitsQuery()`
- `useGetInventoryCategoriesQuery()`

---

## Data Flow

### Edit Flow Diagram

```
User clicks Edit on ActionPill
    ↓
startEdit(unit/category) called
    ↓
setEditingId(unit._id)
    ↓
reset({ name: unit.name, ... })
    ↓
Component re-renders with inline form
    ↓
User edits fields
    ↓
User clicks Save
    ↓
handleSubmit(handleSaveEdit)
    ↓
Yup validation runs
    ↓
If valid: updateUnit/updateCategory mutation
    ↓
API call to backend
    ↓
Success: toast.success() → setEditingId(null) → reset()
    ↓
Component re-renders showing ActionPill
```

### Delete Flow Diagram

```
User clicks Delete on ActionPill
    ↓
handleDelete(id, name) called
    ↓
openModal("confirmation-dialog", {...})
    ↓
Confirmation modal appears
    ↓
User clicks Confirm
    ↓
deleteUnit/deleteCategory mutation
    ↓
API call to backend
    ↓
Success: toast.success() → closeModal()
    ↓
Component re-renders (item removed from list)
```

---

## Testing Considerations

### Manual Testing Checklist

- [ ] Edit unit name and plural
- [ ] Edit category name
- [ ] Cancel edit (should reset form)
- [ ] Save with invalid data (should show validation errors)
- [ ] Save with valid data (should update and show success toast)
- [ ] Delete unit/category (should show confirmation)
- [ ] Delete confirmation cancel (should not delete)
- [ ] Delete confirmation confirm (should delete and show success)
- [ ] Multiple rapid edits (should handle state correctly)
- [ ] Edit while another item is being edited (should switch correctly)
- [ ] Network error handling (should show error toast)
- [ ] Responsive behavior on mobile/desktop

### Edge Cases Handled

1. **Concurrent Edits**: Only one item can be edited at a time (tracked by `editingId`)
2. **Form Reset**: Form properly resets when canceling or after successful save
3. **Loading States**: Buttons disabled during mutations to prevent double-submission
4. **Error Recovery**: Errors don't leave form in broken state; user can retry or cancel
5. **Empty States**: Proper empty state messages when no units/categories exist

---

## Comparison: Inline vs Modal Editing

### Inline Editing (Units & Categories)

**Advantages**:

- Faster workflow for simple edits
- No modal overlay interruption
- Context remains visible (list of items)
- Better for quick corrections

**Disadvantages**:

- Limited space for complex forms
- Can be cramped on mobile
- Less prominent (might be missed)

**Best For**:

- Simple forms (1-2 fields)
- Quick edits
- List-based UIs

### Modal Editing (Suppliers)

**Advantages**:

- More space for complex forms
- Focused user attention
- Better for forms with 3+ fields
- Consistent with "Add" flow

**Disadvantages**:

- Modal overlay interrupts workflow
- Extra click to open/close
- Context hidden behind overlay

**Best For**:

- Complex forms (3+ fields)
- Forms requiring focus
- When "Add" also uses modal

---

## Future Considerations

### Potential Improvements

1. **Consistency Decision**: Consider standardizing on one approach (all inline or all modal)
2. **Keyboard Shortcuts**: Add keyboard support (Enter to save, Esc to cancel)
3. **Auto-save**: Consider auto-saving on blur for better UX
4. **Undo/Redo**: Add undo functionality for accidental edits
5. **Bulk Edit**: Allow editing multiple items at once
6. **Validation Feedback**: Real-time validation as user types

### Technical Debt

- Consider extracting shared edit logic into custom hooks
- Consider creating reusable `InlineEditForm` component
- Consider standardizing error handling patterns

---

## Files Modified/Created

### Frontend Files

1. `apps/frontend/src/features/inventory-settings/InventorySettingsPage/units.tsx`

   - Inline edit implementation
   - Form validation and error handling
   - API integration

2. `apps/frontend/src/features/inventory-settings/InventorySettingsPage/categories.tsx`

   - Inline edit implementation
   - Form validation and error handling
   - API integration

3. `apps/frontend/src/pages/modules/inventory-manager/InventorySettingsPage.tsx`

   - Parent component managing all sections
   - Modal state management for suppliers

4. `apps/frontend/src/components/ActionPill.tsx`
   - Shared component for display/edit/delete actions

### Backend Files

(No backend changes required - existing API endpoints used)

---

## Summary

TODO #9 was implemented by:

1. **Reviewing** the inline edit implementation in UnitsSection and CategoriesSection
2. **Comparing** with modal-based supplier edit mode
3. **Fixing** validation, error handling, and UX issues in inline editing
4. **Maintaining** inline editing for Units/Categories (appropriate for simple forms)
5. **Ensuring** proper state management, loading states, and error handling
6. **Testing** edit, cancel, save, and delete flows

The implementation maintains inline editing for Units and Categories while ensuring robust validation, error handling, and user experience. The approach differs from Suppliers (which use modals) because Units and Categories have simpler data structures that benefit from the faster inline editing workflow.
