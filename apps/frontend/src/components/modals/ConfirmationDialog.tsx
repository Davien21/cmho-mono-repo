import { AlertTriangle, Info } from "lucide-react";
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
    closeModal("confirmation-dialog");
  };

  const { title, message, onConfirm, onCancel, type } = modal?.data || {};

  const icon = getIcon(type);
  const buttonColors = getButtonColors(type);

  return (
    <ResponsiveDialog.Root open={modal.isOpen} onOpenChange={handleClose}>
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
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${buttonColors}`}
            >
              Confirm
            </button>
          </ResponsiveDialog.Footer>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
}
