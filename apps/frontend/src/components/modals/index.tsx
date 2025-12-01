import { AddEmployeeModal } from '@/components/modals/AddEmployeeModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import { UpdateEmployeeModal } from '@/components/modals/UpdateEmployeeModal';
export const Modals = () => {
  return (
    <>
      <AddEmployeeModal />
      <ConfirmationDialog />
      <UpdateEmployeeModal />
    </>
  );
};
