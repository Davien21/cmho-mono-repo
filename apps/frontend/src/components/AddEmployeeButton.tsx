import { useModalContext } from "@/contexts/modal-context";

export const AddEmployeeButton = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { openModal } = useModalContext();

  const handleOpenAddEmployeeModal = () => {
    openModal("employee-form", undefined);
  };

  return (
    <button
      onClick={handleOpenAddEmployeeModal}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
    >
      {children}
    </button>
  );
};
