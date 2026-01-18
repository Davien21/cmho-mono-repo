// modal context
import { IEmployee, IAdmin } from "@/types";
import { IConfirmationDialog, IAddEmployeeRequest } from "@/types";
import { InventoryItem } from "@/types/inventory";
import { createContext, useState, useContext, ReactNode, useMemo } from "react";

// Types for specific modal data
type SignUpModalData = undefined;
type AddEmployeeModalData = IAddEmployeeRequest | undefined;
type UpdateEmployeeModalData = IEmployee;
type ConfirmationDialogData = IConfirmationDialog;
type FailedUploadsModalData = {
  failedFiles: Array<{ file: File; preview: string }>;
};
type EditAdminModalData = IAdmin;
type AddInventoryModalData = undefined;
type EditInventoryModalData = InventoryItem;
type AddStockModalData = InventoryItem;
type ReduceStockModalData = InventoryItem;
type AIPreviewModalData = {
  processedMedia: Array<{
    mediaId: string;
    imageUrl: string;
  }>;
  startIndex?: number;
};

export type ModalDataMap = {
  "sign-up": SignUpModalData;
  "employee-form": AddEmployeeModalData;
  "confirmation-dialog": ConfirmationDialogData;
  "update-employee": UpdateEmployeeModalData;
  "failed-uploads": FailedUploadsModalData;
  "edit-admin": EditAdminModalData;
  "add-inventory": AddInventoryModalData;
  "edit-inventory": EditInventoryModalData;
  "add-stock": AddStockModalData;
  "reduce-stock": ReduceStockModalData;
  "ai-preview": AIPreviewModalData;
};

type ModalState<T> = { isOpen: boolean; data?: T };

// Generalized Modal Context Type
type ModalContextType = {
  openModal: <K extends keyof ModalDataMap>(
    name: K,
    data: ModalDataMap[K]
  ) => void;
  updateModal: <K extends keyof ModalDataMap>(
    name: K,
    data: Partial<ModalDataMap[K]>
  ) => void;
  closeModal: (name: keyof ModalDataMap) => void;
  modals: {
    [K in keyof ModalDataMap]?: ModalState<ModalDataMap[K]>;
  };
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modals, setModals] = useState<ModalContextType["modals"]>({});

  const openModal = <K extends keyof ModalDataMap>(
    name: K,
    data: ModalDataMap[K]
  ) => {
    setModals((prev) => ({ ...prev, [name]: { isOpen: true, data } }));
  };

  const updateModal = <K extends keyof ModalDataMap>(
    name: K,
    data: Partial<ModalDataMap[K]>
  ) => {
    setModals((prev) => ({
      ...prev,
      [name]: {
        isOpen: prev[name]?.isOpen ?? true,
        data: { ...prev[name]?.data, ...data } as ModalDataMap[K],
      },
    }));
  };

  const closeModal = (name: keyof ModalDataMap) => {
    setModals((prev) => ({
      ...prev,
      [name]: { isOpen: false, data: undefined },
    }));
  };

  const contextValue = useMemo(
    () => ({
      openModal,
      updateModal,
      closeModal,
      modals,
    }),
    [modals]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
};
