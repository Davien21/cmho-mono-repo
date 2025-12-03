import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { UpdateEmployeeModal } from "@/components/modals/UpdateEmployeeModal";
import FailedUploadsModal from "@/components/modals/FailedUploadsModal";
export const Modals = () => {
  return (
    <>
      <AddEmployeeModal />
      <ConfirmationDialog />
      <UpdateEmployeeModal />
      <FailedUploadsModal />
    </>
  );
};
