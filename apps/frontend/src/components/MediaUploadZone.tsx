import { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

export interface MediaUploadZoneProps {
  isUploading: boolean;
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  buttonText?: string;
  loadingText?: string;
}

export function MediaUploadZone({
  isUploading,
  onFilesSelected,
  accept = ".jpeg,.jpg,.png,.webp,.heic,image/jpeg,image/jpg,image/png,image/webp,image/heic",
  multiple = true,
  buttonText = "Upload File",
  loadingText = "Uploading...",
}: MediaUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await onFilesSelected(files);
      // Reset input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Button onClick={handleClick} disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}

