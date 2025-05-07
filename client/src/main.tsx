import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeGisClient } from "./hooks/use-google";
import { initializeGapiClient } from "./hooks/use-google";

const waitForGapi = ()=>{
    return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        const checkGapi = () => {
          if (window.gapi && window.google?.accounts?.oauth2) {
            console.log("GAPI and GIS script loaded");
            resolve();
          } else if (Date.now() - startTime > 10000) {
            reject(new Error("GAPI and GIS script failed to load"));
          } else {
            setTimeout(checkGapi, 100);
          }
        };
        checkGapi();
      });
};

waitForGapi()
  .then(() => {
    Promise.all([initializeGapiClient(), initializeGisClient()])
      .then(() => {
        console.log("GAPI initialized successfully");
      })
      .catch((error) => {
        console.error("Failed to initialize GAPI client:", error);
      })
      .finally(() => {
        // Render app regardless of GAPI status
        ReactDOM.createRoot(document.getElementById("root")!).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
      });
  })
  .catch((error) => {
    console.error("GAPI script load failed:", error);
    // Render app with fallback
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });