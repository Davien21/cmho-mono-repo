import { useEffect, useRef, useState } from "react";

interface UseInactivityTimerOptions {
  timeout: number; // milliseconds
  warningTime?: number; // milliseconds before timeout to show warning
  onWarning?: () => void;
  onTimeout: () => void;
  events?: string[]; // events that reset the timer
  enabled?: boolean; // whether the timer is active
  throttleMs?: number; // throttle reset calls (default: 5000ms)
}

export const useInactivityTimer = ({
  timeout,
  warningTime = 60000, // 1 minute warning by default
  onWarning,
  onTimeout,
  events = ["mousedown", "keypress", "touchstart", "click", "scroll"],
  enabled = true,
  throttleMs = 5000, // Only reset once per 5 seconds
}: UseInactivityTimerOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastResetRef = useRef<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = () => {
    if (!enabled) return;

    // Throttle: Only reset if enough time has passed since last reset
    const now = Date.now();
    if (now - lastResetRef.current < throttleMs) {
      return;
    }
    lastResetRef.current = now;

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    setShowWarning(false);

    // Set warning timer
    if (warningTime) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        if (onWarning) onWarning();
      }, timeout - warningTime);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  };

  useEffect(() => {
    if (!enabled) {
      // Clear timers if disabled
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      setShowWarning(false);
      return;
    }

    // Reset timer on mount
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, warningTime, enabled]);

  return { showWarning, resetTimer };
};
