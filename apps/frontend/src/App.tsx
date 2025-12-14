import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import { AppRoutes } from "@/AppRoutes";

import { ModalProvider } from "@/contexts/modal-context";

import { Toaster } from "@/components/ui/sonner";
import { store } from "./store";
import { Provider } from "react-redux";
import { useInactivityTimer } from "@/hooks/use-inactivity-timer";
import { InactivityWarningModal } from "@/components/InactivityWarningModal";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/store/auth-slice";
import { setLockedUser } from "@/lib/locked-user";
import { toast } from "sonner";

// Lazy load modals to avoid loading them on login page
const Modals = lazy(() =>
  import("@/components/modals").then((module) => ({ default: module.Modals }))
);

function AppContent() {
  const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 10 minutes
  const WARNING_TIME = 50 * 1000; // 1 minute warning
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";
  const isLockedPage = location.pathname === "/locked";

  // Get current user data
  const { data: currentUserData } = useGetCurrentUserQuery(undefined, {
    skip: isLoginPage || isLockedPage,
  });

  const [logout] = useLogoutMutation();

  const currentUser = currentUserData?.data;
  const isAuthenticated = !!currentUser;

  const handleLockScreen = async () => {
    if (!currentUser) return;

    try {
      // Store user info for locked screen
      setLockedUser(currentUser.email, currentUser.name);

      // Lock screen (logout from backend)
      await logout().unwrap();

      // Navigate to locked screen
      navigate("/locked");

      toast.info("Screen locked due to inactivity");
    } catch (error) {
      console.error("Failed to lock screen:", error);
      // Even if backend call fails, still lock locally
      setLockedUser(currentUser.email, currentUser.name);
      navigate("/locked");
    }
  };

  const { showWarning, resetTimer } = useInactivityTimer({
    timeout: INACTIVITY_TIMEOUT,
    warningTime: WARNING_TIME,
    onTimeout: handleLockScreen,
    enabled: isAuthenticated && !isLoginPage && !isLockedPage,
  });

  return (
    <>
      <Toaster position="top-center" duration={3000} />
      <ModalProvider>
        <AppRoutes />
        {!isLoginPage && (
          <Suspense fallback={null}>
            <Modals />
          </Suspense>
        )}
        {isAuthenticated && !isLockedPage && (
          <InactivityWarningModal
            open={showWarning}
            warningDuration={WARNING_TIME}
            onStayLoggedIn={resetTimer}
            onLogout={handleLockScreen}
          />
        )}
      </ModalProvider>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}
export default App;
