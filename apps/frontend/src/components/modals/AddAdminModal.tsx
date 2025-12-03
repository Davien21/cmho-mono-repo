import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useModalContext } from "@/contexts/modal-context";
import { useAddAdminMutation } from "@/store/admins-slice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { yupResolver } from "@hookform/resolvers/yup";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminRole } from "@/types";

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
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  roles: yup.array().of(yup.string()),
  isSuperAdmin: yup.boolean(),
});

const availableRoles = Object.values(AdminRole);

export const AddAdminModal = () => {
  const { modals, closeModal } = useModalContext();
  const modal = modals["add-admin"] || { isOpen: false };

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

  const [addAdmin, { isLoading }] = useAddAdminMutation();

  const handleClose = () => {
    closeModal("add-admin");
    formMethods.reset();
  };

  const onSubmit = async (data: IFormValues) => {
    try {
      await addAdmin(data).unwrap();
      toast.success("Admin added successfully");
      handleClose();
    } catch (error: any) {
      if (error.data?.message) {
        toast.error(error.data.message);
      } else {
        toast.error("Failed to add admin");
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

  return (
    <ResponsiveDialog.Root open={modal.isOpen} onOpenChange={handleClose}>
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content>
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title className="text-xl font-bold">
              Add Admin
            </ResponsiveDialog.Title>
            <p className="text-sm text-gray-500">
              Create a new admin account
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
              label="Password"
              type="password"
              {...register("password")}
              placeholder="Enter password (min 6 characters)"
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
                      id={role}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <label
                      htmlFor={role}
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
                    id="isSuperAdmin"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="isSuperAdmin"
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
                Add Admin
              </Button>
            </div>
          </form>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
};

