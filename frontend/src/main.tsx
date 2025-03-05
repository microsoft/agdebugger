import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import { AllowActionsProvider } from "./context/AllowActionsContext.tsx";
import { HoveredMessageProvider } from "./context/HoveredMessageContext.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AllowActionsProvider>
      <HoveredMessageProvider>
        <App />
      </HoveredMessageProvider>
    </AllowActionsProvider>
  </React.StrictMode>,
);
