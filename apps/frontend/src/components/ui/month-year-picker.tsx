import * as React from "react";
import {
  format,
  parse,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthYearPickerProps {
  value?: string | null; // Format: "YYYY-MM" or null
  onChange?: (value: string | undefined) => void; // Returns "YYYY-MM" format
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

// Generate months with value, label, and short form
const getMonths = () => {
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return months.map((date, index) => {
    const monthNumber = index + 1;
    const value = monthNumber.toString().padStart(2, "0");
    const label = format(date, "MMMM"); // Full month name (e.g., "January")
    const shortName = format(date, "MMM"); // Short month name (e.g., "Jan")

    return {
      value,
      label,
      shortName,
    };
  });
};

const MONTHS = getMonths();

// Generate years from current year to 10 years in the future
const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 10; i++) {
    years.push((currentYear + i).toString());
  }
  return years;
};

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "Select month and year",
  className,
  disabled = false,
  required = false,
  id,
}: MonthYearPickerProps) {
  const [month, setMonth] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);

  // Parse value on mount and when value changes
  React.useEffect(() => {
    if (value) {
      try {
        // Value format: "YYYY-MM"
        const [yearPart, monthPart] = value.split("-");
        if (yearPart && monthPart) {
          setYear(yearPart);
          setMonth(monthPart);
        }
      } catch (error) {
        console.error("Error parsing month/year value:", error);
      }
    } else {
      setMonth("");
      setYear("");
    }
  }, [value]);

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    if (year) {
      const newValue = `${year}-${newMonth}`;
      onChange?.(newValue);
    }
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    if (month) {
      const newValue = `${newYear}-${month}`;
      onChange?.(newValue);
    }
  };

  const displayValue = React.useMemo(() => {
    if (month && year) {
      try {
        // Create a date object for the first day of the month for formatting
        const date = parse(`${year}-${month}-01`, "yyyy-MM-dd", new Date());
        return format(date, "MMM yyyy");
      } catch {
        return `${month}/${year}`;
      }
    }
    return null;
  }, [month, year]);

  const years = React.useMemo(() => getYears(), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex gap-2">
          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="max-h-[144px]"
              style={{ minWidth: "100px", width: "100px", maxWidth: "100px" }}
            >
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              style={{ minWidth: "80px", width: "80px", maxWidth: "80px" }}
            >
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
