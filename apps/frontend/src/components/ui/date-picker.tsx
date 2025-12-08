import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | string | null
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  required = false,
  id,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value
      ? typeof value === "string"
        ? new Date(value)
        : value
      : undefined
  )

  React.useEffect(() => {
    if (value) {
      setDate(typeof value === "string" ? new Date(value) : value)
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    onChange?.(selectedDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}


