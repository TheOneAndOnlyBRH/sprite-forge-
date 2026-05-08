import { useEffect, useState, useCallback } from "react";
import type { Provider } from "@/lib/aiService";

const KEY = "spritely.apiKey";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const provider: Provider = "stability";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setApiKeyState(localStorage.getItem(KEY) || "");
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") localStorage.setItem(KEY, key);
  }, []);

  const clearKey = useCallback(() => {
    setApiKeyState("");
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  return { apiKey, provider, setApiKey, clearKey, isConnected: !!apiKey };
}
