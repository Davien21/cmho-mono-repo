"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type IValue = string | number;

interface AutocompleteProps {
  options: { value: IValue; label: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  hideOutsideHoverOrFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function Autocomplete({
  options,
  value = "",
  onValueChange,
  placeholder = "Type or select...",
  emptyText = "No options found.",
  className,
  disabled = false,
  hideOutsideHoverOrFocus = false,
  onFocus,
  onBlur,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const showBorder = !hideOutsideHoverOrFocus || isHovered || open;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn("w-full", className)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
        >
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full font-semibold cursor-pointer",
              hideOutsideHoverOrFocus &&
                !showBorder &&
                "border-transparent bg-transparent hover:border-input hover:bg-background"
            )}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        sideOffset={8}
        style={{ width: "var(--radix-popover-trigger-width)" }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <OptionsList
          options={options}
          value={value}
          setOpen={setOpen}
          onValueChange={onValueChange}
          emptyText={emptyText}
        />
      </PopoverContent>
    </Popover>
  );
}

function OptionsList({
  options,
  value,
  setOpen,
  onValueChange,
  emptyText,
}: {
  options: { value: IValue; label: string }[];
  value: string;
  setOpen: (open: boolean) => void;
  onValueChange: (value: string) => void;
  emptyText: string;
}) {
  // Filter options based on current value
  const filteredOptions = React.useMemo(() => {
    if (!value) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(value.toLowerCase())
    );
  }, [value, options]);

  return (
    <Command shouldFilter={false}>
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup className="max-h-60 overflow-y-auto">
          {filteredOptions.map((option) => (
            <CommandItem
              key={option.value}
              value={option.label}
              onSelect={(selectedLabel) => {
                const selectedOption = options.find(
                  (opt) =>
                    opt.label.toLowerCase() === selectedLabel.toLowerCase()
                );
                if (selectedOption) {
                  onValueChange(selectedOption.label);
                }
                setOpen(false);
              }}
            >
              {option.label}
              <Check
                className={cn(
                  "ml-auto h-4 w-4",
                  value === option.label ? "opacity-100" : "opacity-0"
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
