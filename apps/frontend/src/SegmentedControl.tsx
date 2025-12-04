import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SegmentedControlOption = {
  id: string;
  label?: string;
  content?: ReactNode;
};

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  minItemWidth?: number;
  size?: "default" | "small";
}

export default function SegmentedControl({
  value,
  onChange,
  options,
  minItemWidth,
  size = "default",
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [sliderStyle, setSliderStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  useEffect(() => {
    const activeButton = buttonRefs.current[value];
    const container = containerRef.current;

    if (activeButton && container) {
      const { offsetLeft, offsetWidth } = activeButton;
      // Add a small horizontal inset so the white knob has breathing room
      // and stays visually centered with equal left/right gaps.
      // The container has px-0.5 (2px) padding, and we want 2px gap on each side
      const horizontalInset = 2; // px
      const adjustedLeft = offsetLeft + horizontalInset;
      const adjustedWidth = Math.max(offsetWidth - horizontalInset * 2, 0);

      setSliderStyle({ left: adjustedLeft, width: adjustedWidth });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center bg-slate-200 rounded-lg px-0.5 py-0.5 shadow-inner"
    >
      <div
        className="absolute top-1 bottom-1 bg-white rounded-md shadow-md transition-all duration-200 ease-out"
        style={{
          left: sliderStyle.left,
          width: sliderStyle.width,
        }}
      />

      {options.map((option) => {
        const isActive = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            ref={(el) => {
              buttonRefs.current[option.id] = el;
            }}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-md transition-colors duration-300 font-medium select-none",
              size === "small"
                ? "px-2.5 py-1.5 text-xs"
                : "px-3 py-1.5 text-sm",
              isActive ? "text-slate-900" : "text-slate-500"
            )}
            style={minItemWidth ? { minWidth: `${minItemWidth}px` } : undefined}
          >
            {option.content ?? (
              <span className="whitespace-nowrap">{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
