import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface TextareaWrapperProps {
  label?: string;
  labelClassName?: string;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaWrapperProps>(
  ({ label, labelClassName, textareaProps = {}, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1 w-full")} {...props}>
        {label && (
          <Label
            htmlFor={textareaProps.id}
            className={cn("text-sm font-medium mb-1", labelClassName)}
          >
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          {...textareaProps}
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            textareaProps.className
          )}
        />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
