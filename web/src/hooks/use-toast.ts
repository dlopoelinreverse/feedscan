"use client";

import { useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastId = 0;
const listeners: Array<(toast: ToastMessage) => void> = [];

export function toast(msg: Omit<ToastMessage, "id">) {
  const t: ToastMessage = { ...msg, id: String(++toastId) };
  listeners.forEach((l) => l(t));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((t: ToastMessage) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  // Subscribe on mount
  if (typeof window !== "undefined" && !listeners.includes(addToast)) {
    listeners.push(addToast);
  }

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, dismiss };
}
