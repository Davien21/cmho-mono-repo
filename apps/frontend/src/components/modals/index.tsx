import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { UpdateEmployeeModal } from "@/components/modals/UpdateEmployeeModal";
import FailedUploadsModal from "@/components/modals/FailedUploadsModal";
import { AddAdminModal } from "@/components/modals/AddAdminModal";
import { EditAdminModal } from "@/components/modals/EditAdminModal";
import { DisableAdminModal } from "@/components/modals/DisableAdminModal";
export const Modals = () => {
  return (
    <>
      <AddEmployeeModal />
      <ConfirmationDialog />
      <UpdateEmployeeModal />
      <FailedUploadsModal />
      <AddAdminModal />
      <EditAdminModal />
      <DisableAdminModal />
    </>
  );
};
