/// <reference lib="dom" />
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider, authEvents } from "./contexts/AuthContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { setAuthEventEmitter } from "./lib/api";

setAuthEventEmitter(authEvents);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </AuthProvider>
);
