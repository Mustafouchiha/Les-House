import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./theme.css";
import { applyTheme, applyAccent } from "./theme.js";

// apply saved light/dark + accent color preference before first paint
applyTheme();
applyAccent();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
