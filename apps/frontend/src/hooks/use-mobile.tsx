import * as React from "react"

/**
 * Detects if the device is a mobile device based on user agent
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for mobile device patterns
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

    return mobileRegex.test(userAgent);
  });

  return isMobile;
}
