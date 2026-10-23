import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import PhonePreviewShell from "./components/PhonePreviewShell";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PhonePreviewShell>
      <App />
    </PhonePreviewShell>
  </React.StrictMode>,
);
