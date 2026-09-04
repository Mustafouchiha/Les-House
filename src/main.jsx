import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./theme.css";
import { applyTheme } from "./theme.js";

applyTheme(); // apply saved light/dark preference before first paint

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
