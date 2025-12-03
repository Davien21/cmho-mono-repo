import * as yup from "yup";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useModalContext } from "@/contexts/modal-context";
import { useUpdateAdminMutation } from "@/store/admins-slice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { yupResolver } from "@hookform/resolvers/yup";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminRole, IAdmin } from "@/types";

interface IFormValues {
  name: string;
  email: string;
  password: string;
  roles: string[];
  isSuperAdmin: boolean;
}

const validationSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters"),
  roles: yup.array().of(yup.string()),
  isSuperAdmin: yup.boolean(),
});

const availableRoles = Object.values(AdminRole);

export const EditAdminModal = () => {
  const { modals, closeModal } = useModalContext();
  const modal = modals["edit-admin"] || { isOpen: false };
  const admin = modal.data as IAdmin | undefined;

  const formMethods = useForm<IFormValues>({
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roles: [],
      isSuperAdmin: false,
    },
  });

  const [updateAdmin, { isLoading }] = useUpdateAdminMutation();

  useEffect(() => {
    if (!modal.isOpen || !admin) return;

    formMethods.reset({
      name: admin.name,
      email: admin.email,
      password: "",
      roles: admin.roles || [],
      isSuperAdmin: admin.isSuperAdmin || false,
    });
  }, [modal.isOpen, admin, formMethods]);

  const handleClose = () => {
    closeModal("edit-admin");
    formMethods.reset();
  };

  const onSubmit = async (data: IFormValues) => {
    if (!admin) return;

    try {
      const updateData: any = {
        id: admin._id,
        name: data.name,
        email: data.email,
        roles: data.roles,
        isSuperAdmin: data.isSuperAdmin,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      await updateAdmin(updateData).unwrap();
      toast.success("Admin updated successfully");
      handleClose();
    } catch (error: any) {
      if (error.data?.message) {
        toast.error(error.data.message);
      } else {
        toast.error("Failed to update admin");
      }
    }
  };

  const { register, handleSubmit, formState: { errors }, control, watch } = formMethods;
  const selectedRoles = watch("roles") || [];

  const toggleRole = (role: string) => {
    const currentRoles = selectedRoles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];
    formMethods.setValue("roles", newRoles);
  };

  if (!admin) return null;

  return (
    <ResponsiveDialog.Root
      key={admin._id}
      open={modal.isOpen}
      onOpenChange={handleClose}
    >
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content>
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-xl font-bold">
              Edit Admin
            </ResponsiveDialog.Title>
            <p className="text-sm text-gray-500">
              Update admin account details
            </p>
          </ResponsiveDialog.Header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 w-full p-2 mt-auto"
          >
            <Input
              label="Full Name"
              {...register("name")}
              placeholder="Enter admin's full name"
              formError={errors.name?.message}
            />

            <Input
              label="Email"
              type="email"
              {...register("email")}
              placeholder="Enter admin's email"
              formError={errors.email?.message}
            />

            <Input
              label="Password (leave blank to keep current)"
              type="password"
              {...register("password")}
              placeholder="Enter new password (min 6 characters)"
              formError={errors.password?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles
              </label>
              <div className="space-y-2">
                {availableRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <label
                      htmlFor={`edit-${role}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {role.replace(/_/g, " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isSuperAdmin"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="edit-isSuperAdmin"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="edit-isSuperAdmin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Super Admin
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={isLoading}>
                Update Admin
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
};

