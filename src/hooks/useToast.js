import { useState, useCallback } from "react";

export function useToast() {
  const [message, setMessage] = useState("");

  const showToast = useCallback((text) => {
    setMessage(text);
    window.clearTimeout(window.__reelflowToastTimer);
    window.__reelflowToastTimer = window.setTimeout(() => {
      setMessage("");
    }, 2200);
  }, []);

  return { message, showToast };
}
