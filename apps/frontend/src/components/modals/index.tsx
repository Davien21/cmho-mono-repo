import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { UpdateEmployeeModal } from "@/components/modals/UpdateEmployeeModal";
import FailedUploadsModal from "@/components/modals/FailedUploadsModal";
import { AddAdminModal } from "@/components/modals/AddAdminModal";
import { EditAdminModal } from "@/components/modals/EditAdminModal";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { EditInventoryModal } from "@/components/modals/EditInventoryModal";
import { AddStockModal } from "@/components/modals/AddStockModal";
import { ReduceStockModal } from "@/components/modals/ReduceStockModal";

export const Modals = () => {
  return (
    <>
      <AddEmployeeModal />
      <ConfirmationDialog />
      <UpdateEmployeeModal />
      <FailedUploadsModal />
      <AddAdminModal />
      <EditAdminModal />
      <AddInventoryModal />
      <EditInventoryModal />
      <AddStockModal />
      <ReduceStockModal />
    </>
  );
};
