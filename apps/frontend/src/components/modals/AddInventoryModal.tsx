import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  InventoryCategory,
  InventoryStatus,
  UnitLevel,
} from "@/types/inventory";
import { InventoryCategorySelect } from "@/components/InventoryCategorySelect";
import {
  IInventoryCategoryDto,
  IInventoryUnitDefinitionDto,
  useCreateInventoryItemMutation,
  useGetInventoryCategoriesQuery,
  useGetInventoryUnitsQuery,
} from "@/store/inventory-slice";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { UnitBasedInput } from "@/components/UnitBasedInput";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUploadGalleryMutation, IGalleryDto } from "@/store/gallery-slice";
import { Upload, Image as ImageIcon, X, RotateCcw, Check } from "lucide-react";
import { ImagePickerModal } from "./ImagePickerModal";
import SegmentedControl from "@/SegmentedControl";

interface AddInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuantityInput {
  unitId: string;
  value: string;
}

const inventoryItemSchema = yup.object({
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

type InventoryItemFormValues = yup.InferType<typeof inventoryItemSchema>;

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
              isMobile ? "h-56" : "h-64 sm:h-96"
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
              disabled={isSubmitting || isUploadingImage}
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              <Check size={24} className="sm:size-5" />
              {isSubmitting || isUploadingImage ? "Saving..." : "Save"}
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
              disabled={isSubmitting || isUploadingImage}
              className="w-full px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isSubmitting || isUploadingImage ? "Saving..." : "Skip"}
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
              disabled={isSubmitting || isUploadingImage}
              className="w-full px-6 py-3.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isSubmitting || isUploadingImage ? "Saving..." : "Skip for now"}
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

export function AddInventoryModal({
  open,
  onOpenChange,
}: AddInventoryModalProps) {
  const handleClose = () => {
    // Clean up blob URL if it exists (only blob URLs need to be revoked)
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    onOpenChange(false);
    setStep(1);
    setSelectedImage(null);
    setImagePreview(null);
    setPendingFile(null);
  };
  const isMobile = useMediaQuery("mobile");
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedImage, setSelectedImage] = useState<IGalleryDto | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSetInitialCategory = useRef(false);
  const { data: unitsResponse } = useGetInventoryUnitsQuery();
  const { data: categoriesResponse } = useGetInventoryCategoriesQuery();
  const [uploadGallery, { isLoading: isUploadingImage }] =
    useUploadGalleryMutation();
  const [createInventoryItem] = useCreateInventoryItemMutation();

  const unitsPresets: IInventoryUnitDefinitionDto[] = useMemo(
    () => unitsResponse?.data || [],
    [unitsResponse?.data]
  );

  const categories: IInventoryCategoryDto[] = useMemo(
    () => categoriesResponse?.data || [],
    [categoriesResponse?.data]
  );

  const getDefaultUnitsForCategory = useCallback(
    (categoryName: InventoryCategory): UnitLevel[] => {
      const category = categories.find((c) => c.name === categoryName);
      if (!category) {
        return [];
      }

      // Prefer populated unit presets if available from the API
      if (category.unitPresets && category.unitPresets.length > 0) {
        return category.unitPresets.map((u, index) => ({
          id: u._id,
          name: u.name,
          plural: u.plural,
          // Top-level unit (first in array) defaults to 1, others default to undefined
          quantity: index === 0 ? 1 : undefined,
        }));
      }

      // Fallback to legacy behavior using unitPresetIds + unitsPresets list
      if (!category.unitPresetIds || !category.unitPresetIds.length) {
        return [];
      }

      const presetUnits = category.unitPresetIds
        .map((id) => unitsPresets.find((u) => u._id === id))
        .filter((u): u is IInventoryUnitDefinitionDto => Boolean(u));

      return presetUnits.map((u, index) => ({
        id: u._id,
        name: u.name,
        plural: u.plural,
        // Top-level unit (first in array) defaults to 1, others default to undefined
        quantity: index === 0 ? 1 : undefined,
      }));
    },
    [categories, unitsPresets]
  );

  const getInitialUnits = () => {
    return [] as UnitLevel[];
  };

  const [units, setUnits] = useState<UnitLevel[]>(getInitialUnits);

  const [initialUnits, setInitialUnits] =
    useState<UnitLevel[]>(getInitialUnits);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormValues>({
    resolver: yupResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      inventoryCategory: "",
      lowStockValue: [],
      setupStatus: "ready",
      canBeSold: true,
    },
  });

  const inventoryCategory = watch("inventoryCategory");

  const getBaseUnit = (): UnitLevel | undefined => {
    // Base unit is the last unit in the array
    return units.length > 0 ? units[units.length - 1] : undefined;
  };

  const calculateTotalInBaseUnits = useMemo(() => {
    return (quantityInputs: QuantityInput[]) => {
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
  }, [units]);

  useEffect(() => {
    if (!inventoryCategory) {
      setUnits([]);
      setInitialUnits([]);
      setValue("lowStockValue", []);

      // If we have categories and no category has been chosen yet, default to the first one
      // Only set it once when the modal opens and categories are available
      if (categories.length > 0 && !hasSetInitialCategory.current) {
        hasSetInitialCategory.current = true;
        setValue("inventoryCategory", categories[0].name, {
          shouldValidate: true,
        });
      }
      return;
    }

    // Reset the flag when a category is selected
    hasSetInitialCategory.current = true;

    const defaultUnits = getDefaultUnitsForCategory(
      inventoryCategory as InventoryCategory
    );
    setUnits(defaultUnits);
    setInitialUnits(defaultUnits);
    // Reset low stock value when units change
    const initialLowStock = defaultUnits.map((unit) => ({
      unitId: unit.id,
      value: "0",
    }));
    setValue("lowStockValue", initialLowStock);

    // Prefill canBeSold from category
    const selectedCategory = categories.find(
      (c) => c.name === inventoryCategory
    );
    if (selectedCategory) {
      setValue("canBeSold", selectedCategory.canBeSold ?? true);
    }
  }, [
    inventoryCategory,
    categories,
    unitsPresets,
    setValue,
    getDefaultUnitsForCategory,
  ]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Clean up blob URL if it exists
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      // Reset to step 1 and clear image state
      setStep(1);
      setSelectedImage(null);
      setImagePreview(null);
      setPendingFile(null);
      setIsImagePickerOpen(false);
      hasSetInitialCategory.current = false;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, imagePreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

  const handleImageUpload = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Store the file for later upload (when Save is clicked)
    setPendingFile(file);

    // Clear any previously selected gallery image
    setSelectedImage(null);

    // Create preview from the file (blob URL)
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSelectFromGallery = (galleryItem: IGalleryDto) => {
    // Clear any pending file upload when selecting from gallery
    if (pendingFile && imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setPendingFile(null);

    setSelectedImage(galleryItem);
    const media =
      typeof galleryItem.media_id === "object" ? galleryItem.media_id : null;
    setImagePreview(galleryItem.imageUrl || media?.url || null);
    setIsImagePickerOpen(false);
  };

  const handleRemoveImage = () => {
    // Clean up blob URL if it exists (only blob URLs need to be revoked)
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: InventoryItemFormValues) => {
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
      // If there's a pending file, upload it first
      if (pendingFile) {
        try {
          const formData = new FormData();
          formData.append("file", pendingFile);
          const result = await uploadGallery({ formData }).unwrap();
          setSelectedImage(result.data);

          // Clean up blob URL and use the server URL instead
          if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
          }

          // Set preview to the server URL
          const media =
            typeof result.data.media_id === "object"
              ? result.data.media_id
              : null;
          setImagePreview(result.data.imageUrl || media?.url || null);
          setPendingFile(null);
        } catch (error: unknown) {
          const message =
            getRTKQueryErrorMessage(error) || "Failed to upload image";
          toast.error(message);
          return; // Don't proceed with creating inventory item if upload fails
        }
      }

      // Calculate low stock value in base units from quantity inputs
      const lowStockValueInBaseUnits = values.lowStockValue
        ? calculateTotalInBaseUnits(
            (values.lowStockValue || []) as QuantityInput[]
          )
        : undefined;

      // Get image object if one was selected
      let image: { url: string; mediaId: string } | undefined;
      if (selectedImage) {
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
      }

      // Backend treats `category` as the inventory category name
      const payload: any = {
        name: values.name.trim(),
        category: values.inventoryCategory as InventoryCategory,
        units: units.map((u) => ({
          id: u.id,
          name: u.name,
          plural: u.plural,
          quantity: u.quantity,
        })),
        lowStockValue:
          lowStockValueInBaseUnits && lowStockValueInBaseUnits > 0
            ? lowStockValueInBaseUnits
            : undefined,
        setupStatus: values.setupStatus,
        status: "active" as const,
        currentStockInBaseUnits: 0,
        canBeSold: values.canBeSold,
      };

      // Add image object if available
      if (image) {
        payload.image = image;
      }

      await createInventoryItem(payload).unwrap();
      toast.success("Inventory item created successfully");
      handleClose();
    } catch (error: unknown) {
      const message =
        getRTKQueryErrorMessage(error) ||
        "Failed to create inventory item. Please try again.";
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
                  {step === 1 ? "Create Inventory Item" : "Add Image"}
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
                  ? "Create a new inventory item by filling in the details below"
                  : "Upload an image for the inventory item or select one from the gallery"}
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
                        htmlFor="inventory-category"
                        className="text-base sm:text-sm"
                      >
                        Category
                      </Label>
                      <Controller
                        name="inventoryCategory"
                        control={control}
                        render={({ field }) => (
                          <InventoryCategorySelect
                            id="inventory-category"
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
                    <p className="text-xs text-muted-foreground hidden md:block mt-2 mb-2">
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

                <ResponsiveDialog.Footer className="flex flex-row gap-3 justify-end pt-6 border-t px-0 flex-shrink-0 mt-4">
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
