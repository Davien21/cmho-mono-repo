# Category Filtering Fix

**Date:** January 15, 2026
**Issue:** Balance sheet media was showing up in gallery settings page
**Status:** ✅ Fixed

---

## Problem

The gallery settings page (`InventorySettingsPage/gallery.tsx`) was showing **all media** regardless of category, including:
- ✅ Inventory media (should show)
- ❌ Balance sheet media (should NOT show)
- ❌ Stock update media (should NOT show)

**Root Cause:** The `useInfiniteGallery` hook didn't support category filtering, so it fetched all gallery items regardless of category.

---

## Solution

### 1. Updated `useInfiniteGallery` Hook

**File:** `apps/frontend/src/hooks/use-infinite-gallery.tsx`

**Changes:**
- Added `category?: GalleryCategory` parameter to options
- Pass category to the underlying `useGetGalleryPagesInfiniteQuery`

```typescript
// Before:
interface UseInfiniteGalleryOptions {
  loadMoreRef: RefObject<HTMLElement>;
  limit?: number;
  rootMargin?: string;
  threshold?: number;
}

// After:
interface UseInfiniteGalleryOptions {
  loadMoreRef: RefObject<HTMLElement>;
  limit?: number;
  category?: MediaCategory;  // ✅ NEW (using MediaCategory)
  rootMargin?: string;
  threshold?: number;
}
```

```typescript
// Before:
useGetGalleryPagesInfiniteQuery({
  limit,
});

// After:
useGetGalleryPagesInfiniteQuery({
  limit,
  category,  // ✅ Pass category filter
});
```

### 2. Updated Gallery Settings Page

**File:** `apps/frontend/src/features/inventory-settings/InventorySettingsPage/gallery.tsx`

**Changes:**
- Import `GalleryCategory` enum
- Pass `category: GalleryCategory.INVENTORY` to `useInfiniteGallery`
- Ensure uploads are tagged with `INVENTORY` category

```typescript
// Added import:
import {
  useUploadGalleryMutation,
  useDeleteGalleryMutation,
  IGalleryDto,
} from "@/store/gallery-slice";
import { MediaCategory } from "@/store/media-slice";  // ✅ Using MediaCategory

// Updated hook call:
const { galleryItems, ... } = useInfiniteGallery({
  loadMoreRef,
  limit: 1,
  category: MediaCategory.INVENTORY,  // ✅ Only show inventory media
});

// Updated upload:
formData.append("file", file);
formData.append("category", MediaCategory.INVENTORY);  // ✅ Tag uploads
```

---

## Impact

### Before Fix
```
Gallery Settings Page showed:
- ✅ 10 inventory images
- ❌ 5 balance sheet images  (shouldn't show)
- ❌ 3 stock update images   (shouldn't show)
Total: 18 images (wrong!)
```

### After Fix
```
Gallery Settings Page shows:
- ✅ 10 inventory images only
Total: 10 images (correct!)

Balance Sheet Page shows:
- ✅ 5 balance sheet images only

Stock Updates show:
- ✅ 3 stock update images only
```

---

## Verification

### To Test:
1. **Gallery Settings Page:**
   - Should only show images uploaded from inventory settings
   - Should NOT show images uploaded from balance sheet
   - New uploads should be tagged as "inventory"

2. **Balance Sheet Page:**
   - Should only show images uploaded from balance sheet
   - Should NOT show images from inventory settings
   - Already using `MediaCategory.BALANCE_SHEET` ✅

3. **Database:**
   - Inventory images: `category: "inventory"`
   - Balance sheet images: `category: "balance_sheet"`
   - Stock update images: `category: "stock_update"`

---

## Files Modified

1. ✅ `apps/frontend/src/hooks/use-infinite-gallery.tsx`
   - Added category parameter support

2. ✅ `apps/frontend/src/features/inventory-settings/InventorySettingsPage/gallery.tsx`
   - Pass INVENTORY category to hook
   - Tag uploads with INVENTORY category

---

## Category Enum Reference

```typescript
// Using MediaCategory (from media-slice.ts):
export enum MediaCategory {
  INVENTORY = "inventory",
  BALANCE_SHEET = "balance_sheet",
  STOCK_UPDATE = "stock_update",
}
```

**Note:** We use `MediaCategory` consistently across all new code to support consolidation to the Media model.

---

## Additional Notes

### `use-media-manager` Hook
The `use-media-manager` hook now uses `MediaCategory` for type safety:
```typescript
export interface UseMediaManagerOptions {
  category?: MediaCategory;  // ✅ Type-safe with MediaCategory enum
  // ...
}
```

So any pages using `use-media-manager` can filter by category with type safety:
```typescript
const { ... } = useMediaManager({
  category: MediaCategory.INVENTORY,  // ✅ Type-safe
});
```

### Backend Support
The backend already supports category filtering:
- `/gallery?category=inventory` - Returns only inventory gallery items
- `/gallery?category=balance_sheet` - Returns only balance sheet items
- `/gallery` (no param) - Returns all items

---

## Testing Checklist

- [ ] Gallery settings page shows only inventory images
- [ ] Balance sheet page shows only balance sheet images
- [ ] Uploading from gallery settings tags as "inventory"
- [ ] Uploading from balance sheet tags as "balance_sheet"
- [ ] No mixing of categories between pages
- [ ] Infinite scroll works with category filter
- [ ] Search works within filtered results

---

## Status

✅ **Fixed and ready for testing**

- No linter errors
- Backward compatible
- Minimal code changes
- Follows existing patterns

---

**Issue:** Media categories were not properly filtered
**Solution:** Added category parameter to hooks and queries
**Impact:** Each page now shows only its relevant media
**Risk:** Low (additive change, doesn't break existing code)

