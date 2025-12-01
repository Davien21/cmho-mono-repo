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
