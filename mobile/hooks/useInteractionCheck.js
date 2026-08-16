import { useCallback, useRef, useState } from "react";
import { checkInteractions, RANKS } from "@/services/interactionService";

export const useInteractionCheck = () => {
  const [checking, setChecking] = useState(false);
  const [payload, setPayload] = useState(null);
  const [visible, setVisible] = useState(false);
  const resolverRef = useRef(null);

  const checkAndConfirm = useCallback(async (medicationNames) => {
    setChecking(true);
    try {
      const result = await checkInteractions(medicationNames);
      if (result.rank === RANKS.SAFE) {
        return result;
      }
      setPayload(result);
      setVisible(true);
      const proceed = await new Promise((resolve) => {
        resolverRef.current = resolve;
      });
      return proceed ? result : null;
    } finally {
      setChecking(false);
    }
  }, []);

  const settle = useCallback((proceed) => {
    setVisible(false);
    setPayload(null);
    resolverRef.current?.(proceed);
    resolverRef.current = null;
  }, []);

  const onProceed = useCallback(() => settle(true), [settle]);
  const onCancel = useCallback(() => settle(false), [settle]);

  return { checkAndConfirm, checking, payload, visible, onProceed, onCancel };
};
