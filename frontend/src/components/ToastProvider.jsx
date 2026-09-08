"use client";

import { createContext, useContext, useState } from "react";
import { Toast } from "@/components/ui/Shared";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, tone = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toast toasts={toasts} />
    </ToastContext.Provider>
  );
}