import { AlertTriangle, Info, Loader2 } from "lucide-react";
import type { IConfirmationDialog } from "@/types";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useModalContext } from "@/contexts/modal-context";

const getIcon = (type: IConfirmationDialog["type"]) => {
  if (type === "danger") {
    return <AlertTriangle className="w-6 h-6 text-red-600" />;
  } else if (type === "warning") {
    return <AlertTriangle className="w-6 h-6 text-amber-600" />;
  } else {
    return <Info className="w-6 h-6 text-blue-600" />;
  }
};

const getButtonColors = (type: IConfirmationDialog["type"]) => {
  if (type === "danger") {
    return "bg-red-600 hover:bg-red-700";
  } else if (type === "warning") {
    return "bg-amber-600 hover:bg-amber-700";
  } else {
    return "bg-blue-600 hover:bg-blue-700";
  }
};

export default function ConfirmationDialog() {
  const { modals, closeModal } = useModalContext();
  const modal = modals["confirmation-dialog"] || { isOpen: false };

  const handleClose = () => {
    const { isLoading = false } = modal?.data || {};
    // Prevent closing during loading
    if (isLoading) return;
    closeModal("confirmation-dialog");
  };

  const { title, message, onConfirm, onCancel, type, isLoading = false } =
    modal?.data || {};

  const icon = getIcon(type);
  const buttonColors = getButtonColors(type);

  return (
    <ResponsiveDialog.Root
      open={modal.isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          handleClose();
        }
      }}
    >
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content className="max-w-sm w-full">
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {icon}
              {title}
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description className="text-gray-600">
              {message}
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <ResponsiveDialog.Footer className="flex gap-3 mt-6">
            <button
              onClick={onCancel ?? handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonColors}`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm
            </button>
          </ResponsiveDialog.Footer>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
