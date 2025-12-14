import { Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";

import { useLoginMutation } from "@/store/auth-slice";
import { toast } from "sonner";
import { getRTKQueryErrorMessage } from "@/lib/utils";
import { getLockedUser, clearLockedUser } from "@/lib/locked-user";
import { PasswordInput } from "@/components/PasswordInput";

interface IFormValues {
  password: string;
}

const validationSchema = yup.object().shape({
  password: yup
    .string()
    .min(4, "Password must be at least 4 characters")
    .required("Password is required"),
});

export default function LockedScreenPage() {
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();

  // Get locked user data from localStorage
  const lockedUser = getLockedUser();

  // If no locked user, redirect to login
  useEffect(() => {
    if (!lockedUser) {
      navigate("/login", { replace: true });
    }
  }, [lockedUser, navigate]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: IFormValues) => {
    if (!lockedUser) return;

    try {
      await login({
        email: lockedUser.email,
        password: data.password,
      }).unwrap();

      // Clear locked user data on successful login
      clearLockedUser();

      toast.success("Welcome back!");
      navigate("/");
    } catch (error: unknown) {
      const errorMessage = getRTKQueryErrorMessage(error);
      if (errorMessage) return toast.error(errorMessage);

      toast.error("Failed to unlock. Please check your password.");
    }
  };

  const handleLoginAsDifferentUser = () => {
    // Clear locked user data and go to login page
    clearLockedUser();
    navigate("/login");
  };

  if (!lockedUser) {
    return null;
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          {/* User Avatar */}
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-md">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
              {getInitials(lockedUser.name)}
            </span>
          </div>

          {/* User Info */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            {lockedUser.name}
          </h2>
          <p className="text-gray-600 text-sm mb-4">{lockedUser.email}</p>

          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            <Lock className="w-4 h-4" />
            <span>Screen Locked</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="password"
                  label="Enter your password to unlock"
                  labelClassName="text-gray-700"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoFocus
                  formError={errors.password?.message}
                  placeholder="Enter your password"
                />
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Unlock
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleLoginAsDifferentUser}
            className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-gray-100"
          >
            <User className="w-4 h-4" />
            Login as different user
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Locked due to inactivity for security purposes
        </div>
      </div>
    </div>
  );
}
