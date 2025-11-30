import React, { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useLoginMutation } from "@/store/auth-slice";
import { toast } from "sonner";
import { getRTKQueryErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      await login({ password }).unwrap();

      navigate("/");
    } catch (error) {
      const errorMessage = getRTKQueryErrorMessage(error);
      if (errorMessage) return toast.error(errorMessage);

      toast.error("Failed to login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            CMHO Portal
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Enter your password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              placeholder="Enter your password"
              required
              minLength={4}
            />
          </div>

          <button
            type="submit"
            disabled={password.length < 4 || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Demo: Use any password with 4+ characters
          </p>
        </div>
      </div>
    </div>
  );
}
