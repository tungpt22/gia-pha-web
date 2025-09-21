// src/main.tsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { setApiBase } from "./config/api";

setApiBase("http://localhost:3000/api/v1"); // đặt base cho backend

const rootEl = document.getElementById("root");
if (!rootEl)
  throw new Error(
    'Không tìm thấy #root. Hãy thêm <div id="root"></div> vào index.html.'
  );

createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
