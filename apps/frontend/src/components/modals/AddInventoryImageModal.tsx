import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X, RotateCcw, Check } from "lucide-react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUploadGalleryMutation, IGalleryDto } from "@/store/gallery-slice";
import { ImagePickerModal } from "./ImagePickerModal";
import { toast } from "sonner";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { InventoryItem } from "@/types/inventory";
import {
  useUpdateInventoryItemMutation,
  useGetInventoryItemsQuery,
} from "@/store/inventory-slice";

interface AddInventoryImageModalProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit"; // "add" for adding new image, "edit" for editing existing
}

export function AddInventoryImageModal({
  item,
  open,
  onOpenChange,
  mode = "add",
}: AddInventoryImageModalProps) {
  const isMobile = useMediaQuery("mobile");
  const [selectedImage, setSelectedImage] = useState<IGalleryDto | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    mode === "edit" && item.image?.url ? item.image.url : null
  );
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadGallery, { isLoading: isUploadingImage }] =
    useUploadGalleryMutation();
  const [updateInventoryItem, { isLoading: isSubmitting }] =
    useUpdateInventoryItemMutation();
  const { refetch } = useGetInventoryItemsQuery();

  const [dragActive, setDragActive] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && item.image?.url) {
        setImagePreview(item.image.url);
        setSelectedImage(null);
      } else {
        setImagePreview(null);
        setSelectedImage(null);
      }
    } else {
      // Clean up blob URL if it exists
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setSelectedImage(null);
      setIsImagePickerOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, mode, item.image]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
      handleImageUpload(e.dataTransfer.files[0]);
    }
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
      const message = getRTKQueryErrorMessage(error, "Failed to upload image");
      toast.error(message);
      // Clean up blob URL on error
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(
        mode === "edit" && item.image?.url ? item.image.url : null
      );
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

  const handleSave = async () => {
    try {
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
      } else if (imagePreview && item.image && !selectedImage) {
        // Keep existing image if no new one was selected and preview matches existing
        image = item.image;
      }
      // If imagePreview is null and item.image is also null, image stays undefined (no change)

      const updatePayload: any = {
        id: item.id,
      };

      // Only update image if it changed
      if (image !== undefined) {
        updatePayload.image = image;
      }

      await updateInventoryItem(updatePayload).unwrap();

      await refetch();
      toast.success(
        mode === "add"
          ? "Image added successfully"
          : "Image updated successfully"
      );
      onOpenChange(false);
    } catch (error: unknown) {
      const message = getRTKQueryErrorMessage(
        error,
        "Failed to update image. Please try again."
      );
      toast.error(message);
    }
  };

  const handleClose = () => {
    // Clean up blob URL if it exists
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    onOpenChange(false);
  };

  const handleBoxClick = () => {
    if (isMobile && !imagePreview && !isUploadingImage) {
      fileInputRef.current?.click();
    }
  };

  const title = mode === "add" ? "Add Image" : "Edit Image";

  return (
    <>
      <ResponsiveDialog.Root open={open} onOpenChange={handleClose}>
        <ResponsiveDialog.Portal>
          <ResponsiveDialog.Overlay />
          <ResponsiveDialog.Content className="max-w-[550px] w-full max-h-[90vh] flex flex-col">
            <ResponsiveDialog.Header className="px-0 xl:pr-10 flex-shrink-0">
              <ResponsiveDialog.Title className="text-2xl sm:text-2xl font-bold">
                {title}
              </ResponsiveDialog.Title>
              <ResponsiveDialog.Description className="sr-only">
                {mode === "add"
                  ? "Add an image for the inventory item"
                  : "Update the image for the inventory item"}
              </ResponsiveDialog.Description>
            </ResponsiveDialog.Header>

            <div className="flex-1 min-h-0 overflow-y-auto px-1">
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
                          onClick={handleRemoveImage}
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
                          {isUploadingImage
                            ? "Uploading..."
                            : "Tap to add a photo"}
                        </p>
                      </div>
                    ) : (
                      <div className="py-16 px-6 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 sm:w-20 sm:h-20 bg-gray-200 rounded-full mb-4">
                          <Upload
                            size={44}
                            className="sm:size-9 text-gray-500"
                          />
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={20} className="sm:size-4" />
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSubmitting || isUploadingImage}
                      className="flex items-center justify-center gap-2"
                    >
                      <Check size={20} className="sm:size-4" />
                      {isSubmitting || isUploadingImage ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : isMobile ? (
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={20} />
                      Choose from Gallery
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSave}
                      disabled={isSubmitting || isUploadingImage}
                    >
                      {isSubmitting || isUploadingImage ? "Saving..." : "Skip"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex items-center justify-center gap-2"
                      >
                        <Upload size={20} className="sm:size-4" />
                        {isUploadingImage ? "Uploading..." : "Upload"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsImagePickerOpen(true)}
                        className="flex items-center justify-center gap-2"
                      >
                        <ImageIcon size={20} className="sm:size-4" />
                        Choose from Gallery
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSave}
                      disabled={isSubmitting || isUploadingImage}
                      className="w-full"
                    >
                      {isSubmitting || isUploadingImage
                        ? "Saving..."
                        : "Skip for now"}
                    </Button>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          </ResponsiveDialog.Content>
        </ResponsiveDialog.Portal>
      </ResponsiveDialog.Root>

      <ImagePickerModal
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={handleSelectFromGallery}
      />
    </>
  );
}
