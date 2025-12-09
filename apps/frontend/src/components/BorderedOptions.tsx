import { MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface BorderedOptionsProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export function BorderedOptions({
  children,
  align = "end",
  className,
  contentClassName,
  side,
  sideOffset,
}: BorderedOptionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`h-9 w-9 sm:h-8 sm:w-8 border-gray-300 hover:bg-gray-50 ${className || ""}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

