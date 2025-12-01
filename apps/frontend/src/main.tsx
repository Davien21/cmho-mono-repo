import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a div with id='root'");
}

createRoot(rootElement).render(
  <StrictMode>
    {/* <ThemeProvider defaultTheme="dark"> */}
    <App />
    {/* </ThemeProvider> */}
  </StrictMode>
);
