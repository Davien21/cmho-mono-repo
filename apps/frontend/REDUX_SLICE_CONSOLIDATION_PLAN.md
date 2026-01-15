# Redux Slice Consolidation Plan

**Date:** January 15, 2026
**Status:** ⚠️ Decision Required Before Implementation

---

## Current State Analysis

### gallery-slice.ts (166 lines)

**Purpose:** UI-focused gallery management with pagination

**Endpoints:**

- `getGallery` - Paginated list with merge logic
- `getGalleryPages` - Infinite query support
- `getGalleryItem` - Single item fetch
- `uploadGallery` - Upload with name and category
- `updateGallery` - Update gallery metadata
- `deleteGallery` - Delete gallery item

**Types:**

- `IGalleryDto` - Wraps media_id (can be populated or string)
- `GalleryCategory` enum
- `IGalleryResponse` - With pagination meta

**Features:**

- ✅ Infinite scroll support
- ✅ Pagination with merge logic
- ✅ Force refetch on param changes
- ✅ Name and category metadata

**Backend:** Uses `/gallery` endpoints

### media-slice.ts (79 lines)

**Purpose:** Direct media file management

**Endpoints:**

- `getMedia` - Simple list with category filter
- `uploadMedia` - Upload with category
- `deleteMedia` - Delete by public_id
- `transcribeImage` - AI transcription (unique feature)

**Types:**

- `IMediaDto` - Direct media file data
- `MediaCategory` enum
- `ITranscriptionResult` - AI transcription result

**Features:**

- ✅ Direct file operations
- ✅ AI transcription support
- ⚠️ No pagination
- ⚠️ No infinite scroll

**Backend:** Uses `/media` endpoints

---

## Files Using gallery-slice (9 files)

1. ✅ `components/MediaGrid.tsx` (new component we created)
2. ✅ `features/inventory-settings/InventorySettingsPage/gallery.tsx`
3. ✅ `hooks/use-media-manager.tsx` (new hook we created)
4. ✅ `components/app-sidebar.tsx`
5. ✅ `components/GalleryCard.tsx`
6. ✅ `components/modals/ImagePickerModal.tsx`
7. ✅ `components/modals/AddInventoryImageModal.tsx`
8. ✅ `pages/modules/inventory-manager/InventorySettingsPage.tsx`
9. ✅ `hooks/use-infinite-gallery.tsx`

## Files Using media-slice (at least 1)

1. ✅ `pages/modules/inventory-manager/BalanceStockPage.tsx`

---

## Problem Statement

**The Challenge:**

1. Gallery slice provides pagination features that media slice lacks
2. Media slice is used where pagination isn't needed (BalanceStockPage)
3. Backend has both `/gallery` and `/media` endpoints (after our migration)
4. 9 files depend on gallery-slice - changing them risks breaking features

**The Question:**
Should we:

- **Option A:** Add gallery features to media-slice and migrate all files?
- **Option B:** Keep both slices but add media operations to gallery-slice?
- **Option C:** Create a gradual migration path with backward compatibility?

---

## Option A: Merge into media-slice (Full Consolidation)

### What This Means

- Add pagination/infinite query to media-slice
- Update all 9 files to use media-slice instead
- Deprecate and remove gallery-slice
- Backend eventually removes `/gallery` endpoints

### Pros

✅ Single source of truth
✅ Simpler mental model
✅ Follows consolidation goal
✅ Long-term maintainability

### Cons

❌ High risk of breaking changes
❌ Requires updating 9 files
❌ Need to test all gallery features
❌ Backend still has `/gallery` endpoints
❌ Potential for subtle bugs

### Implementation Steps

1. Add to media-slice:
   - Infinite query support
   - Pagination with merge logic
   - Update/get single item endpoints
   - Name metadata support
2. Update all 9 files to use media-slice
3. Test every gallery feature
4. Remove gallery-slice
5. Update backend to deprecate `/gallery` endpoints
6. Eventually remove backend Gallery module

### Estimated Effort

- **Time:** 4-6 hours
- **Risk:** High
- **Testing Required:** Extensive

---

## Option B: Keep Both Slices (Status Quo+)

### What This Means

- Keep gallery-slice for UI/pagination features
- Keep media-slice for direct file operations
- Document when to use each
- Add gallery operations to media-slice for flexibility

### Pros

✅ Zero risk of breaking existing features
✅ No refactoring needed
✅ Clear separation of concerns
✅ Backend remains unchanged

### Cons

❌ Doesn't achieve consolidation goal
❌ Two sources of truth
❌ Developers must choose which to use
❌ Potential for confusion

### Implementation Steps

1. Document when to use each slice
2. Add convenience methods if needed
3. Move forward with current architecture

### Estimated Effort

- **Time:** 1 hour (documentation)
- **Risk:** None
- **Testing Required:** None

---

## Option C: Gradual Migration (Recommended)

### What This Means

- Enhance media-slice with gallery features
- Create adapter/compatibility layer
- Migrate files one-by-one
- Keep gallery-slice until all migrations complete
- Thorough testing at each step

### Pros

✅ Low risk (gradual approach)
✅ Can rollback at any point
✅ Test each file individually
✅ Achieves consolidation goal
✅ Backward compatible during migration

### Cons

⚠️ Takes longer
⚠️ Temporary maintenance of both slices
⚠️ Need adapter layer temporarily

### Implementation Steps

#### Phase 1: Enhance media-slice (No Breaking Changes)

```typescript
// Add to media-slice.ts:
1. Add getMediaPages (infinite query)
2. Add getMediaWithPagination (merge logic)
3. Add updateMedia endpoint
4. Add getMediaItem endpoint
5. Support for name metadata

// Result: media-slice has feature parity with gallery-slice
```

#### Phase 2: Create Compatibility Types

```typescript
// Create adapter types that work with both:
export type MediaOrGalleryDto = IMediaDto | IGalleryDto;

// Helper functions to normalize data:
export const toMediaDto = (item: MediaOrGalleryDto): IMediaDto => { ... };
export const toGalleryDto = (media: IMediaDto): IGalleryDto => { ... };
```

#### Phase 3: Migrate Files One-by-One

```
Priority order (lowest risk first):
1. ✅ MediaGrid.tsx (new component, easy to change)
2. ✅ use-media-manager.tsx (new hook, easy to change)
3. ⚠️ use-infinite-gallery.tsx (test infinite scroll)
4. ⚠️ gallery.tsx (main feature, test thoroughly)
5. ⚠️ ImagePickerModal.tsx
6. ⚠️ AddInventoryImageModal.tsx
7. ⚠️ GalleryCard.tsx
8. ⚠️ app-sidebar.tsx
9. ⚠️ InventorySettingsPage.tsx

After each file:
- Test the feature thoroughly
- Ensure no regressions
- Commit separately
- Can rollback if issues found
```

#### Phase 4: Deprecate gallery-slice

```
1. All files migrated ✅
2. Add deprecation warning to gallery-slice
3. Update documentation
4. Keep for 1-2 releases for safety
```

#### Phase 5: Remove gallery-slice

```
1. Remove gallery-slice.ts
2. Remove gallery endpoints from backend
3. Update all documentation
```

### Estimated Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 1 hour
- **Phase 3:** 3-4 hours (9 files)
- **Phase 4:** 30 minutes
- **Phase 5:** 30 minutes
- **Total:** 7-9 hours
- **Risk:** Low (gradual, can rollback)
- **Testing Required:** Incremental

---

## Recommendation: Option C (Gradual Migration)

### Why This Is Best

1. **Low Risk:** Migrate one file at a time, test thoroughly
2. **Achieves Goal:** Full consolidation in the end
3. **Rollback Safety:** Can revert any single file if issues arise
4. **Thorough Testing:** Test each migration individually
5. **No Breaking Changes:** Users never see disruption

### What We've Already Done (✅ ~70% of Phase 1)

- ✅ Backend migration complete (Gallery → Media)
- ✅ Created `useMediaManager` hook (ready for media-slice)
- ✅ Created shared components (MediaGrid, etc.)
- ✅ Removed duplicate code from gallery.tsx

### What Remains (~30% of full migration)

- ⏳ Add infinite query support to media-slice
- ⏳ Add pagination merge logic to media-slice
- ⏳ Migrate 9 files to use media-slice
- ⏳ Remove gallery-slice after migration

---

## Immediate Next Steps (If Approved)

### Step 1: Enhance media-slice (2-3 hours)

Add these endpoints to `media-slice.ts`:

```typescript
// Add infinite query support
getMediaPages: builder.infiniteQuery<...>({...})

// Add paginated query with merge logic
getMediaPaginated: builder.query<...>({
  merge: (currentCache, newItems) => {...},
  forceRefetch({...}) => {...}
})

// Add single item query
getMediaItem: builder.query<...>({...})

// Add update endpoint
updateMedia: builder.mutation<...>({...})
```

### Step 2: Update `use-media-manager.tsx` (30 min)

Change from gallery-slice to media-slice:

```typescript
// Before:
import { useUploadGalleryMutation } from "@/store/gallery-slice";

// After:
import { useUploadMediaMutation } from "@/store/media-slice";
```

### Step 3: Migrate Other Files (1 file per 30 min)

Repeat for each of the 9 files, testing thoroughly after each.

---

## Testing Checklist Per File

After migrating each file, test:

- [ ] Upload functionality works
- [ ] Delete functionality works
- [ ] Pagination works (if applicable)
- [ ] Infinite scroll works (if applicable)
- [ ] Selection works
- [ ] Search/filtering works
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No visual regressions

---

## Rollback Plan

If issues arise during migration:

```bash
# Rollback specific file
git checkout HEAD -- path/to/file.tsx

# Or rollback entire migration
git revert <commit-hash>
```

Gallery-slice remains functional until full migration is complete.

---

## Decision Required

**Please choose:**

- ✅ **Option A:** Full merge now (high risk, 4-6 hours)
- ✅ **Option B:** Keep both slices (no consolidation, 1 hour docs)
- ✅ **Option C:** Gradual migration (recommended, 7-9 hours, low risk)

Once decided, I can proceed with implementation.

---

## Notes

- Backend still has both `/gallery` and `/media` endpoints
- All backend migration is complete (Phase 1 done)
- Frontend shared components are ready (Phase 2 started)
- This document provides the path to completion
- Zero breaking changes until gallery-slice is fully removed
