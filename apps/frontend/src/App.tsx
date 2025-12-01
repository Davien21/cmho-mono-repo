import { BrowserRouter, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { AppRoutes } from '@/AppRoutes';

import { ModalProvider } from '@/contexts/modal-context';

import { Toaster } from '@/components/ui/sonner';
import { store } from './store';
import { Provider } from 'react-redux';

// Lazy load modals to avoid loading them on login page
const Modals = lazy(() =>
  import('@/components/modals').then((module) => ({ default: module.Modals }))
);

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

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
