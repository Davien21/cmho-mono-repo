import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import EditIcon from "@/icons/EditIcon";
import { ReactNode } from "react";

interface ActionPillProps {
  label: ReactNode;
  className?: string;
  onClickLabel?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ActionPill({
  label,
  className,
  onClickLabel,
  onEdit,
  onDelete,
  isDeleting,
}: ActionPillProps) {
  return (
    <div
      className={cn(
        // Compact chip similar to the sample: light border, subtle background,
        // text with a simple "X" remove icon.
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={onClickLabel}
        className={cn(
          "text-slate-900 font-medium",
          onClickLabel && "hover:text-slate-950"
        )}
      >
        {label}
      </button>
      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            className="inline-flex h-5 w-5 items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-40"
          >
            <EditIcon className="h-4 w-4 fill-current" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Remove"
            className="inline-flex h-5 w-5 items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
