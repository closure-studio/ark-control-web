import { useCallback, useEffect, useRef, useState } from "react";
import { COPY_FEEDBACK_DURATION_MS } from "@/components/accounts/accountHelpers";

export function useCopyFeedback() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyText = useCallback(async (key: string, text: string) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      timerRef.current = window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
        timerRef.current = null;
      }, COPY_FEEDBACK_DURATION_MS);
      return true;
    } catch {
      setCopiedKey(null);
      return false;
    }
  }, []);

  return { copiedKey, copyText };
}
