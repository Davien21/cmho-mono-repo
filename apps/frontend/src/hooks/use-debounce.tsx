import { useState, useEffect } from "react";

/**
 * Custom hook that debounces a value by delaying updates.
 *
 * @param value - the value to debounce.
 * @param delay - the delay in milliseconds before updating the value.
 * @returns the debounced value.
 **/

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
