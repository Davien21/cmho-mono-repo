import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  formError?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelClassName, className, type, id, formError, ...rest }, ref) => {
    if (type === "file") {
      return <input type="file" ref={ref} hidden {...rest} />;
    }

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <Label
            htmlFor={id}
            className={cn("text-sm font-medium", labelClassName)}
          >
            {label}
          </Label>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          aria-invalid={formError ? "true" : "false"}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "placeholder:text-gray-400",
            formError &&
              "border-destructive ring-destructive/20 dark:ring-destructive/40",
            className
          )}
          {...rest}
        />
        {formError && (
          <span className="text-xs text-red-600 block">{formError}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
