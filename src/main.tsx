
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./app/App.tsx";
import "./styles/index.css";

const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === "true";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    {ENABLE_ANALYTICS ? <Analytics /> : null}
  </>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
  