import { useState, useEffect, useRef, useMemo } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UnitGroupingBuilder } from "../UnitGroupingBuilder";
import {
  InventoryItem,
  InventoryCategory,
  InventoryStatus,
  UnitLevel,
} from "@/types/inventory";
import {
  IInventoryUnitDefinitionDto,
  IInventoryCategoryDto,
  useGetInventoryItemsQuery,
  useGetInventoryUnitsQuery,
  useGetInventoryCategoriesQuery,
  useUpdateInventoryItemMutation,
} from "@/store/inventory-slice";
import { InventoryCategorySelect } from "@/components/InventoryCategorySelect";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUploadGalleryMutation, IGalleryDto } from "@/store/gallery-slice";
import { Upload, Image as ImageIcon, X, RotateCcw, Check } from "lucide-react";
import { ImagePickerModal } from "./ImagePickerModal";
import SegmentedControl from "@/SegmentedControl";

interface EditInventoryModalProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuantityInput {
  unitId: string;
  value: string;
}

const editInventoryItemSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  inventoryCategory: yup.string().trim().required("Category is required"),
  lowStockValue: yup
    .array()
    .of(
      yup.object({
        unitId: yup.string().required(),
        value: yup.string().required(),
      })
    )
    .optional(),
  setupStatus: yup
    .mixed<InventoryStatus>()
    .oneOf(["draft", "ready"])
    .required(),
  canBeSold: yup.boolean().optional(),
});

type EditInventoryFormValues = yup.InferType<typeof editInventoryItemSchema>;

interface ImageUploadStepProps {
  imagePreview: string | null;
  isUploadingImage: boolean;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (file: File) => void;
  onSelectFromGallery: () => void;
  onRemoveImage: () => void;
  onSkip: () => void;
}

function ImageUploadStep({
  imagePreview,
  isUploadingImage,
  isSubmitting,
  fileInputRef,
  onFileInput,
  onImageUpload,
  onSelectFromGallery,
  onRemoveImage,
  onSkip,
}: ImageUploadStepProps) {
  const isMobile = useMediaQuery("mobile");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const clearPreview = () => {
    onRemoveImage();
  };

  const handleBoxClick = () => {
    if (isMobile && !imagePreview && !isUploadingImage) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="mb-4">
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all ${
              isMobile ? "h-60" : "h-64 sm:h-96"
            } flex items-center justify-center overflow-hidden ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : imagePreview
                ? "border-green-500 bg-gray-50"
                : "border-gray-300 bg-gray-50"
            } ${isMobile && !imagePreview ? "cursor-pointer" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleBoxClick}
          >
            {imagePreview ? (
              <div className="relative w-full h-full p-4 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={clearPreview}
                  className="absolute top-6 right-6 bg-red-500 text-white p-2.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg z-10 select-none"
                  aria-label="Remove image"
                >
                  <X size={24} className="sm:size-5" />
                </button>
              </div>
            ) : isMobile ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6">
                <div className="w-16 h-16 flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">
                  {isUploadingImage ? "Uploading..." : "Tap to add a photo"}
                </p>
              </div>
            ) : (
              <div className="py-16 px-6 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 sm:w-20 sm:h-20 bg-gray-200 rounded-full mb-4">
                  <Upload size={44} className="sm:size-9 text-gray-500" />
                </div>
                <p className="text-2xl sm:text-xl font-medium text-gray-900 mb-2">
                  Drag and drop an image here
                </p>
                <p className="text-base sm:text-sm text-gray-500">
                  or use the buttons below
                </p>
              </div>
            )}
          </div>
        </div>

        {imagePreview ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onRemoveImage}
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-base sm:text-sm select-none"
            >
              <RotateCcw size={24} className="sm:size-5" />
              Reset
            </button>
            <button
              type="button"
              onClick={onSkip}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm select-none"
            >
              <Check size={24} className="sm:size-5" />
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onSelectFromGallery}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-base select-none"
            >
              <ImageIcon size={20} />
              Choose from Gallery
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-base select-none"
            >
              Skip
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm select-none"
              >
                <Upload size={24} className="sm:size-5" />
                {isUploadingImage ? "Uploading..." : "Upload"}
              </button>
              <button
                type="button"
                onClick={onSelectFromGallery}
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-base sm:text-sm select-none"
              >
                <ImageIcon size={24} className="sm:size-5" />
                Choose from Gallery
              </button>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="w-full px-6 py-3.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-base sm:text-sm select-none"
            >
              Skip for now
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileInput}
          className="hidden"
        />
      </div>
    </>
  );
}

export function EditInventoryModal({
  item,
  open,
  onOpenChange,
}: EditInventoryModalProps) {
  const handleClose = () => {
    // Clean up blob URL if it exists
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    onOpenChange(false);
    setStep(1);
    setSelectedImage(null);
    setImagePreview(item.image?.url || null);
  };
  const isMobile = useMediaQuery("mobile");
  const [step, setStep] = useState<1 | 2>(1);
  const [units, setUnits] = useState<UnitLevel[]>(item.units || []);
  const [initialUnits] = useState<UnitLevel[]>(item.units || []);
  const [selectedImage, setSelectedImage] = useState<IGalleryDto | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item.image?.url || null
  );
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadGallery, { isLoading: isUploadingImage }] =
    useUploadGalleryMutation();

  // Store initial values for change detection
  const initialValuesRef = useRef({
    name: item.name,
    category: item.category,
    image: item.image || null,
    units: item.units || [],
    lowStockValue: item.lowStockValue,
    setupStatus: item.status,
    canBeSold: (item as any).canBeSold ?? true,
  });

  const { refetch } = useGetInventoryItemsQuery();
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const { data: categoriesResponse } = useGetInventoryCategoriesQuery();
  const unitsPresets: IInventoryUnitDefinitionDto[] = useMemo(
    () => unitsResponse?.data || [],
    [unitsResponse?.data]
  );
  const categories: IInventoryCategoryDto[] = useMemo(
    () => categoriesResponse?.data || [],
    [categoriesResponse?.data]
  );

  // Initialize low stock value as QuantityInput array
  const getInitialLowStockValue = (): QuantityInput[] => {
    if (!units.length) return [];
    return units.map((unit) => ({
      unitId: unit.id,
      value: "0",
    }));
  };

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditInventoryFormValues>({
    resolver: yupResolver(editInventoryItemSchema),
    defaultValues: {
      name: item.name,
      inventoryCategory: item.inventoryCategory,
      lowStockValue: getInitialLowStockValue(),
      setupStatus: item.status,
      canBeSold: (item as any).canBeSold ?? true,
    },
  });

  const inventoryCategory = watch("inventoryCategory");

  // Update low stock value when units are available
  useEffect(() => {
    if (units.length > 0) {
      const initialLowStock = getInitialLowStockValue();
      setValue("lowStockValue", initialLowStock);
    }
  }, [units, setValue]);

  // Prefill canBeSold from category when category changes
  useEffect(() => {
    if (inventoryCategory) {
      const selectedCategory = categories.find(
        (c) => c.name === inventoryCategory
      );
      if (selectedCategory) {
        setValue("canBeSold", selectedCategory.canBeSold ?? true);
      }
    }
  }, [inventoryCategory, categories, setValue]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Clean up blob URL if it exists (we need to check current value)
      const currentPreview = imagePreview;
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      // Reset to step 1 and image state to original item image
      setStep(1);
      if (item.image?.url) {
        setImagePreview(item.image.url);
      } else {
        setImagePreview(null);
      }
      setSelectedImage(null);
      setIsImagePickerOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, item, imagePreview]);

  // Initialize image preview when item changes
  useEffect(() => {
    if (item.image?.url) {
      setImagePreview(item.image.url);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
  }, [item]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  const calculateTotalInBaseUnits = (quantityInputs: QuantityInput[]) => {
    if (!units.length) return 0;

    let total = 0;

    units.forEach((unit, unitIndex) => {
      const input = quantityInputs.find((qi) => qi.unitId === unit.id);
      const qty = parseFloat(input?.value || "0");

      if (qty <= 0) return;

      // Calculate multiplier for this unit to base unit
      // Multiply all child unit quantities (units that come after this one)
      let multiplier = 1;
      for (let i = unitIndex + 1; i < units.length; i++) {
        multiplier *= units[i].quantity || 1;
      }

      total += qty * multiplier;
    });

    return total;
  };

  const [updateInventoryItem] = useUpdateInventoryItemMutation();

  const handleNext = async () => {
    if (units.length === 0) {
      alert("Please define at least one unit");
      return;
    }

    const baseUnit = getBaseUnit();

    if (!baseUnit) {
      alert("Please define at least one unit");
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadGallery({ formData }).unwrap();
      setSelectedImage(result.data);

      // Clean up blob URL and use the server URL instead
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      // Set preview to the server URL
      const media =
        typeof result.data.media_id === "object" ? result.data.media_id : null;
      setImagePreview(result.data.imageUrl || media?.url || null);

      toast.success("Image uploaded successfully");
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) || "Failed to upload image";
      toast.error(message);
      // Clean up blob URL on error
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(item.image?.url || null);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSelectFromGallery = (galleryItem: IGalleryDto) => {
    setSelectedImage(galleryItem);
    const media =
      typeof galleryItem.media_id === "object" ? galleryItem.media_id : null;
    setImagePreview(galleryItem.imageUrl || media?.url || null);
    setIsImagePickerOpen(false);
  };

  const handleRemoveImage = () => {
    // Clean up blob URL if it exists
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: EditInventoryFormValues) => {
    if (units.length === 0) {
      alert("Please define at least one unit");
      return;
    }

    const baseUnit = getBaseUnit();

    if (!baseUnit) {
      alert("Please define at least one unit");
      return;
    }

    try {
      // Calculate low stock value in base units from quantity inputs
      const lowStockValueInBaseUnits = values.lowStockValue
        ? calculateTotalInBaseUnits(
            (values.lowStockValue || []) as QuantityInput[]
          )
        : undefined;

      // Get image object if one was selected or if existing image should be removed
      let image: { url: string; mediaId: string } | undefined | null;
      if (selectedImage) {
        // New image was selected
        const media =
          typeof selectedImage.media_id === "object"
            ? selectedImage.media_id
            : null;
        const imageUrl = selectedImage.imageUrl || media?.url;
        const mediaId =
          typeof selectedImage.media_id === "object"
            ? selectedImage.media_id._id
            : selectedImage.media_id;

        if (imageUrl && mediaId) {
          image = {
            url: imageUrl,
            mediaId: mediaId,
          };
        }
      } else if (!imagePreview && item.image) {
        // Image was removed (imagePreview is null but item had an image)
        image = null;
      } else if (imagePreview && item.image) {
        // Keep existing image if no new one was selected and preview matches existing
        image = item.image;
      }
      // If imagePreview is null and item.image is also null, image stays undefined (no change)

      const newName = values.name.trim();
      const newCategory = values.inventoryCategory as InventoryCategory;
      const newUnits = units.map((u) => ({
        id: u.id,
        name: u.name,
        plural: u.plural,
        quantity: u.quantity,
      }));
      const newLowStockValue =
        lowStockValueInBaseUnits && lowStockValueInBaseUnits > 0
          ? lowStockValueInBaseUnits
          : undefined;
      const newSetupStatus = values.setupStatus;
      const newCanBeSold = values.canBeSold;

      // Detect changes by comparing with initial values
      const changedFields: string[] = [];
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      // Compare name
      if (newName !== initialValuesRef.current.name) {
        changedFields.push("name");
        oldValues.name = initialValuesRef.current.name;
        newValues.name = newName;
      }

      // Compare category
      if (newCategory !== initialValuesRef.current.category) {
        changedFields.push("category");
        oldValues.category = initialValuesRef.current.category;
        newValues.category = newCategory;
      }

      // Compare image
      const oldImageId = initialValuesRef.current.image?.mediaId || null;
      const newImageId = image?.mediaId || null;
      if (oldImageId !== newImageId) {
        changedFields.push("image");
        oldValues.image = initialValuesRef.current.image;
        newValues.image = image;
      }

      // Compare units (simplified: check if array length or structure changed)
      const unitsChanged =
        JSON.stringify(newUnits) !==
        JSON.stringify(initialValuesRef.current.units);
      if (unitsChanged) {
        changedFields.push("units");
        oldValues.units = initialValuesRef.current.units;
        newValues.units = newUnits;
      }

      // Compare lowStockValue
      // Check if the form array is still all zeros (default/unmodified)
      const isLowStockUnchanged =
        !values.lowStockValue ||
        values.lowStockValue.length === 0 ||
        values.lowStockValue.every((input) => {
          const val = parseFloat(input.value || "0");
          return val === 0 || isNaN(val);
        });

      // Only mark as changed if:
      // 1. The form was actually modified (not all zeros), AND
      // 2. The calculated value differs from the initial value
      if (!isLowStockUnchanged) {
        // Normalize values: treat undefined, null, and 0 as equivalent (no value set)
        const oldLowStock = initialValuesRef.current.lowStockValue;
        const normalizedOldLowStock =
          oldLowStock === undefined || oldLowStock === null || oldLowStock === 0
            ? undefined
            : oldLowStock;
        const normalizedNewLowStock =
          newLowStockValue === undefined ||
          newLowStockValue === null ||
          newLowStockValue === 0
            ? undefined
            : newLowStockValue;

        if (normalizedNewLowStock !== normalizedOldLowStock) {
          changedFields.push("lowStockValue");
          oldValues.lowStockValue = initialValuesRef.current.lowStockValue;
          newValues.lowStockValue = newLowStockValue;
        }
      }

      // Compare setupStatus
      if (newSetupStatus !== initialValuesRef.current.setupStatus) {
        changedFields.push("setupStatus");
        oldValues.setupStatus = initialValuesRef.current.setupStatus;
        newValues.setupStatus = newSetupStatus;
      }

      // Compare canBeSold
      if (newCanBeSold !== initialValuesRef.current.canBeSold) {
        changedFields.push("canBeSold");
        oldValues.canBeSold = initialValuesRef.current.canBeSold;
        newValues.canBeSold = newCanBeSold;
      }

      const updatePayload: any = {
        id: item.id,
        name: newName,
        category: newCategory,
        units: newUnits,
        lowStockValue: newLowStockValue,
        setupStatus: newSetupStatus,
        canBeSold: newCanBeSold,
      };

      // Add, update, or remove image
      if (image !== undefined) {
        updatePayload.image = image;
      }

      // Include change metadata if there are any changes
      if (changedFields.length > 0) {
        updatePayload._changes = {
          changedFields,
          oldValues,
          newValues,
        };
      }

      await updateInventoryItem(updatePayload).unwrap();

      await refetch();
      toast.success("Inventory item updated successfully");
      handleClose();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to update inventory item. Please try again.";
      toast.error(message);
    }
  };

  return (
    <ResponsiveDialog.Root open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-[550px] w-full max-h-[90vh] flex flex-col">
          <form
            onSubmit={
              step === 1
                ? handleSubmit(() => handleNext())
                : handleSubmit(onSubmit)
            }
            className="flex flex-col flex-1 min-h-0 space-y-4"
          >
            <ResponsiveDialog.Header className="px-0 xl:pr-10 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                  {step === 1 ? "Edit Inventory Item" : "Edit Image"}
                </ResponsiveDialog.Title>
                {step === 1 && (
                  <div className="flex items-center gap-3">
                    <Controller
                      name="setupStatus"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange(value as InventoryStatus)
                          }
                        >
                          <SelectTrigger
                            className={`min-w-[90px] w-full sm:w-[120px] h-9 text-sm font-medium border-0 shadow-none ${
                              field.value === "ready"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
              </div>
              <ResponsiveDialog.Description className="sr-only">
                {step === 1
                  ? "Edit the inventory item details below"
                  : "Update the image for the inventory item or select one from the gallery"}
              </ResponsiveDialog.Description>
            </ResponsiveDialog.Header>

            {step === 1 ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base sm:text-sm">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="e.g., Paracetamol 500mg"
                        className="text-base sm:text-sm h-11 sm:h-9"
                      />
                      {errors.name?.message && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-inventory-category"
                        className="text-base sm:text-sm"
                      >
                        Category
                      </Label>
                      <Controller
                        name="inventoryCategory"
                        control={control}
                        render={({ field }) => (
                          <InventoryCategorySelect
                            id="edit-inventory-category"
                            value={field.value}
                            onChange={(v) =>
                              field.onChange(v as InventoryCategory)
                            }
                            errorMessage={errors.inventoryCategory?.message}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <UnitGroupingBuilder
                    units={units}
                    onChange={setUnits}
                    initialUnits={initialUnits}
                    presets={unitsPresets}
                  />
                </div>

                {units.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <UnitBasedInput
                      control={control}
                      name="lowStockValue"
                      units={units}
                      label="Low Stock Value *"
                      error={errors.lowStockValue?.message}
                    />
                    <p className="text-xs text-muted-foreground hidden md:block mt-2">
                      We will alert you when stock falls below this value
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-10 mt-4">
                  <Label className="text-base sm:text-sm text-gray-700">
                    Will this item be sold?
                  </Label>
                  <Controller
                    name="canBeSold"
                    control={control}
                    render={({ field }) => (
                      <SegmentedControl
                        size="small"
                        minItemWidth={70}
                        value={field.value ? "yes" : "no"}
                        onChange={(value) => field.onChange(value === "yes")}
                        options={[
                          { id: "no", label: "No" },
                          { id: "yes", label: "Yes" },
                        ]}
                      />
                    )}
                  />
                </div>

                <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-6 border-t px-0 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size={isMobile ? "lg" : "default"}
                    onClick={handleClose}
                    className="w-full sm:w-auto text-base sm:text-sm h-11 sm:h-9 px-6 sm:px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size={isMobile ? "lg" : "default"}
                    className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-base sm:text-sm h-11 sm:h-9 px-6 sm:px-4"
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                </ResponsiveDialog.Footer>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto px-1">
                <ImageUploadStep
                  imagePreview={imagePreview}
                  isUploadingImage={isUploadingImage}
                  isSubmitting={isSubmitting}
                  fileInputRef={fileInputRef}
                  onFileInput={handleFileInput}
                  onImageUpload={handleImageUpload}
                  onSelectFromGallery={() => setIsImagePickerOpen(true)}
                  onRemoveImage={handleRemoveImage}
                  onSkip={handleSubmit(onSubmit)}
                />
              </div>
            )}
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>

      <ImagePickerModal
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={handleSelectFromGallery}
      />
    </ResponsiveDialog.Root>
  );
}
