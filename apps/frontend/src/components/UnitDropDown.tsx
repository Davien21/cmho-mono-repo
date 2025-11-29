import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import * as React from "react";

const PREDEFINED_UNITS = [
  "Pack",
  "Box",
  "Card",
  "Strip",
  "Sachet",
  "Bottle",
  "Tube",
  "Piece",
  "Tablet",
  "Capsule",
];

interface UnitDropdownProps {
  unitId: string;
  value: string;
  units?: string[];
  className?: string;
  maxHeight?: number | string;
  onSelect: (unitId: string, value: string) => void;
  customUnits: string[];
  onAddCustomUnit: (unitId: string, value: string) => void;
}

// Custom UnitDropdown component using Popover with keyboard accessibility
const UnitDropdown = React.memo(
  ({
    unitId,
    value,
    units = [],
    className,
    maxHeight = 180,
    onSelect,
    customUnits,
    onAddCustomUnit,
  }: UnitDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customValue, setCustomValue] = useState("");
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [isCustomInputFocused, setIsCustomInputFocused] = useState(false);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const customInputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Combine all options for keyboard navigation
    const allOptions = [...units, ...customUnits];
    const totalItems = allOptions.length;

    // Reset focus when dropdown opens/closes
    useEffect(() => {
      if (!isOpen) return;

      setFocusedIndex(0);
      setIsCustomInputFocused(false);
      // Focus first item when opening
      setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 0);
    }, [isOpen]);

    const handleUnitSelect = (unitId: string, value: string) => {
      onSelect(unitId, value);
      setIsOpen(false);
    };

    const handleConfirmCustomUnit = () => {
      const trimmedValue = customValue.trim();
      if (trimmedValue) {
        onAddCustomUnit(unitId, trimmedValue);
        setCustomValue("");
        setIsOpen(false);
      }
    };

    const handleCancelCustomUnit = () => {
      setCustomValue("");
    };

    // Keyboard navigation handlers
    const handleArrowDown = () => {
      if (isCustomInputFocused) {
        // Move from custom input back to first item
        setIsCustomInputFocused(false);
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
      } else if (focusedIndex < totalItems - 1) {
        // Move to next item
        const nextIndex = focusedIndex + 1;
        setFocusedIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
      } else if (focusedIndex === totalItems - 1) {
        // Move to custom input
        setIsCustomInputFocused(true);
        setFocusedIndex(-1);
        customInputRef.current?.focus();
      }
    };

    const handleArrowUp = () => {
      if (isCustomInputFocused) {
        // Move from custom input to last item
        setIsCustomInputFocused(false);
        const lastIndex = totalItems - 1;
        setFocusedIndex(lastIndex);
        itemRefs.current[lastIndex]?.focus();
      } else if (focusedIndex > 0) {
        // Move to previous item
        const prevIndex = focusedIndex - 1;
        setFocusedIndex(prevIndex);
        itemRefs.current[prevIndex]?.focus();
      } else if (focusedIndex === 0) {
        // Move from first item to custom input
        setIsCustomInputFocused(true);
        setFocusedIndex(-1);
        customInputRef.current?.focus();
      }
    };

    const handleEnterKey = () => {
      if (
        !isCustomInputFocused &&
        focusedIndex >= 0 &&
        focusedIndex < totalItems
      ) {
        handleUnitSelect(unitId, allOptions[focusedIndex]);
      }
    };

    const handleEscapeKey = () => {
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleTabKey = () => {
      // Allow tab to naturally move focus but close dropdown
      setIsOpen(false);
    };

    const handleHomeKey = () => {
      setFocusedIndex(0);
      setIsCustomInputFocused(false);
      itemRefs.current[0]?.focus();
    };

    const handleEndKey = () => {
      setIsCustomInputFocused(true);
      setFocusedIndex(-1);
      customInputRef.current?.focus();
    };

    const handleTypeAhead = (key: string) => {
      // Type-ahead functionality - search for items starting with the typed character
      const char = key.toLowerCase();
      const startIndex = focusedIndex + 1;

      // Search from current position to end
      for (let i = startIndex; i < totalItems; i++) {
        if (allOptions[i].toLowerCase().startsWith(char)) {
          setFocusedIndex(i);
          itemRefs.current[i]?.focus();
          return;
        }
      }

      // Wrap around to beginning
      for (let i = 0; i < startIndex && i < totalItems; i++) {
        if (allOptions[i].toLowerCase().startsWith(char)) {
          setFocusedIndex(i);
          itemRefs.current[i]?.focus();
          return;
        }
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        // Open dropdown on Enter, Space, or Arrow Down when closed
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          handleArrowDown();
          break;

        case "ArrowUp":
          e.preventDefault();
          handleArrowUp();
          break;

        case "Enter":
          e.preventDefault();
          handleEnterKey();
          break;

        case "Escape":
          e.preventDefault();
          handleEscapeKey();
          break;

        case "Tab":
          handleTabKey();
          break;

        case "Home":
          e.preventDefault();
          handleHomeKey();
          break;

        case "End":
          e.preventDefault();
          handleEndKey();
          break;

        default:
          // Only handle type-ahead if not in custom input
          if (e.key.length === 1 && !isCustomInputFocused) {
            e.preventDefault();
            handleTypeAhead(e.key);
          }
          break;
      }
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            className={cn(
              "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md",
              "border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[&>span]:line-clamp-1",
              className
            )}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={`Select unit, current value: ${value || "none"}`}
            data-state={isOpen ? "open" : "closed"}
          >
            <span className={cn(!value && "text-muted-foreground")}>
              {value || "Pick unit"}
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-[200px] p-0",
            "rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          align="start"
          sideOffset={4}
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            maxHeight:
              typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
            overflow: "hidden",
          }}
        >
          <div
            className="p-1 overflow-auto"
            style={{
              maxHeight:
                typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
            }}
            role="listbox"
            aria-label="Unit options"
          >
            {/* Predefined units */}
            {units.map((unitName, index) => (
              <button
                key={unitName}
                ref={(el) => (itemRefs.current[index] = el)}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center",
                  "rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  focusedIndex === index && "bg-accent text-accent-foreground",
                  value === unitName && "font-medium"
                )}
                onClick={() => handleUnitSelect(unitId, unitName)}
                onFocus={() => {
                  setFocusedIndex(index);
                  setIsCustomInputFocused(false);
                }}
                role="option"
                aria-selected={value === unitName}
                tabIndex={-1}
              >
                {unitName}
                {value === unitName && (
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}

            {/* Custom units */}
            {customUnits.map((unitName, index) => {
              const actualIndex = units.length + index;
              return (
                <button
                  key={unitName}
                  ref={(el) => (itemRefs.current[actualIndex] = el)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center",
                    "rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    focusedIndex === actualIndex &&
                      "bg-accent text-accent-foreground",
                    value === unitName && "font-medium"
                  )}
                  onClick={() => handleUnitSelect(unitId, unitName)}
                  onFocus={() => {
                    setFocusedIndex(actualIndex);
                    setIsCustomInputFocused(false);
                  }}
                  role="option"
                  aria-selected={value === unitName}
                  tabIndex={-1}
                >
                  {unitName}
                  {value === unitName && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}

            <div className="-mx-1 my-1 h-px bg-muted" />

            {/* Custom input section */}
            <div className="px-1 pb-1">
              <div className="flex items-center gap-1 px-1">
                <Input
                  ref={customInputRef}
                  placeholder="Custom unit..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onFocus={() => {
                    setIsCustomInputFocused(true);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConfirmCustomUnit();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      handleKeyDown(e);
                    }
                  }}
                  className={cn(
                    "h-7 text-sm flex-1",
                    isCustomInputFocused && "ring-1 ring-ring"
                  )}
                  aria-label="Enter custom unit"
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmCustomUnit();
                  }}
                  aria-label="Confirm custom unit"
                  tabIndex={-1}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelCustomUnit();
                  }}
                  aria-label="Cancel custom unit"
                  tabIndex={-1}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

UnitDropdown.displayName = "UnitDropdown";

export { UnitDropdown };
