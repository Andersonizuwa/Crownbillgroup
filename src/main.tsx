/// <reference lib="dom" />
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </AuthProvider>
);
