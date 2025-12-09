import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthPickerInputProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

export function MonthPickerInput({
  value,
  onChange,
  placeholder = "Pick a month",
  className,
  disabled = false,
  required = false,
  id,
  minDate,
  maxDate,
  disabledDates,
}: MonthPickerInputProps) {
  const [month, setMonth] = React.useState<Date | undefined>(
    value
      ? typeof value === "string"
        ? new Date(value)
        : value
      : undefined
  );
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>();

  React.useEffect(() => {
    if (value) {
      setMonth(typeof value === "string" ? new Date(value) : value);
    } else {
      setMonth(undefined);
    }
  }, [value]);

  // Use ResizeObserver for better performance - only observes the specific element
  React.useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const updateWidth = () => {
      setPopoverWidth(element.offsetWidth);
    };

    // Initial measurement
    updateWidth();

    // Use ResizeObserver for efficient width tracking
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedMonth: Date) => {
    setMonth(selectedMonth);
    onChange?.(selectedMonth);
    setOpen(false); // Close popover when month is selected
  };

  return (
    <div ref={wrapperRef} className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !month && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {month ? format(month, "MMM yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: popoverWidth ? `${popoverWidth}px` : undefined }}
        >
          <MonthPicker
            onMonthSelect={handleSelect}
            selectedMonth={month}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

