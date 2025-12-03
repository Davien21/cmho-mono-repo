import { X } from "lucide-react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useModalContext } from "@/contexts/modal-context";
import { Button } from "@/components/ui/button";

interface FailedFile {
  file: File;
  preview: string;
  error?: string;
}

interface FailedUploadsModalData {
  failedFiles: FailedFile[];
}

export default function FailedUploadsModal() {
  const { modals, closeModal } = useModalContext();
  const modal = modals["failed-uploads"] || { isOpen: false };

  const handleClose = () => {
    closeModal("failed-uploads");
    // Clean up preview URLs
    if (modal?.data?.failedFiles) {
      modal.data.failedFiles.forEach((item: FailedFile) => {
        URL.revokeObjectURL(item.preview);
      });
    }
  };

  const { failedFiles = [] } = modal?.data || {};

  return (
    <ResponsiveDialog.Root
      open={modal.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-4xl w-full max-h-[90vh] flex flex-col">
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-lg font-semibold text-gray-900">
              Failed Uploads ({failedFiles.length})
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description className="text-gray-600">
              The following {failedFiles.length === 1 ? "image" : "images"}{" "}
              failed to upload
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {failedFiles.map((item: FailedFile, index: number) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-destructive/20 bg-muted"
                >
                  <div className="aspect-square flex items-center justify-center bg-muted">
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                    <div className="truncate">{item.file.name}</div>
                    {item.error && (
                      <div
                        className="text-[10px] text-red-300 mt-1 truncate"
                        title={item.error}
                      >
                        {item.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveDialog.Footer className="flex gap-3 mt-4">
            <Button onClick={handleClose} variant="outline" className="w-full">
              Close
            </Button>
          </ResponsiveDialog.Footer>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
