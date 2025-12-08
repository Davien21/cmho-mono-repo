import { useModalContext } from "@/contexts/modal-context";
import { useDisableAdminMutation } from "@/store/admins-slice";
import { toast } from "sonner";
import { IAdmin } from "@/types";
import { useEffect } from "react";

export const DisableAdminModal = () => {
  const { modals, closeModal } = useModalContext();
  const modal = modals["disable-admin"] || { isOpen: false };
  const admin = modal.data as IAdmin | undefined;

  const [disableAdmin, { isLoading }] = useDisableAdminMutation();

  useEffect(() => {
    if (!modal.isOpen || !admin) return;

    const handleDisable = async () => {
      try {
        await disableAdmin(admin._id).unwrap();
        toast.success("Admin disabled successfully");
        closeModal("disable-admin");
        closeModal("confirmation-dialog");
      } catch (error: any) {
        if (error.data?.message) {
          toast.error(error.data.message);
        } else {
          toast.error("Failed to disable admin");
        }
        closeModal("disable-admin");
      }
    };

    handleDisable();
  }, [modal.isOpen, admin, disableAdmin, closeModal]);

  return null;
};


