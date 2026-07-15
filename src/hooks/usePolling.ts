import { useEffect, useRef } from "react";

export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let interval: number | null = null;
    function stop() {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
    }
    function start() {
      stop();
      if (document.visibilityState !== "visible") return;
      interval = window.setInterval(() => callbackRef.current(), intervalMs);
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        callbackRef.current();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, intervalMs]);
}
