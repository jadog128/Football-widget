import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import CustomizerApp from "./components/CustomizerApp";
import DeepseekStandalone from "./DeepseekStandalone";
import CreditsStandalone from "./CreditsStandalone";
import ToastStandalone from "./ToastStandalone";
import "./styles/index.css";

const container = document.getElementById("root");
const root = createRoot(container);

const hash = window.location.hash;
const isCustomizer = hash === "#customizer";
const isDeepseek = hash === "#deepseek";
const isCredits = hash === "#credits";
const isToast = hash === "#toast";

root.render(
  <React.StrictMode>
    {isToast ? (
      <ToastStandalone />
    ) : isCredits ? (
      <CreditsStandalone />
    ) : isDeepseek ? (
      <DeepseekStandalone />
    ) : isCustomizer ? (
      <CustomizerApp />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
