import * as React from "react";

type Size = "mobile" | "tablet" | "desktop";

const breakpoints: Record<Size, string> = {
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
};

type Matcher = Size | (string & {});

export function useMediaQuery(matcher: Matcher): boolean {
  const query = React.useMemo(() => {
    return matcher in breakpoints ? breakpoints[matcher as Size] : matcher;
  }, [matcher]);

  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const updateMatch = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQueryList.addEventListener("change", updateMatch);
    setMatches(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener("change", updateMatch);
    };
  }, [query]);

  return matches;
}
