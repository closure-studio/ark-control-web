import { useEffect, useRef } from "react";

const DOCUMENT_VISIBLE_STATE = "visible";

export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let interval: number | null = null;
    function stop() {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
    }
    function start() {
      stop();
      if (document.visibilityState !== DOCUMENT_VISIBLE_STATE) return;
      interval = window.setInterval(() => callbackRef.current(), intervalMs);
    }
    function handleVisibility() {
      if (document.visibilityState === DOCUMENT_VISIBLE_STATE) {
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
