import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/AppRoutes";

import { ModalProvider } from "@/contexts/modal-context";

import { Toaster } from "@/components/ui/sonner";
import { Modals } from "@/components/modals";
import { store } from "./store";
import { Provider } from "react-redux";

function App() {
  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <Toaster position="top-center" duration={3000} />
          <ModalProvider>
            <AppRoutes />
            <Modals />
          </ModalProvider>
        </BrowserRouter>
      </Provider>
    </>
  );
}
export default App;
