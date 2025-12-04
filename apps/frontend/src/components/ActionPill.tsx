import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import EditIcon from "@/icons/EditIcon";
import { ReactNode } from "react";
import { motion, MotionStyle } from "framer-motion";

interface ActionPillProps {
  label: ReactNode;
  className?: string;
  style?: MotionStyle;
  onClickLabel?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ActionPill({
  label,
  className,
  style,
  onClickLabel,
  onEdit,
  onDelete,
  isDeleting,
}: ActionPillProps) {
  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 sm:px-3.5 sm:py-1.5 text-base sm:text-sm select-none",
        className
      )}
      style={style}
    >
      <button
        type="button"
        onClick={onClickLabel}
        className={cn(
          "text-slate-900 font-medium select-none",
          onClickLabel && "hover:text-slate-950"
        )}
      >
        {label}
      </button>
      <div className="flex items-center gap-1 select-none">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            className="inline-flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-40 select-none"
          >
            <EditIcon className="h-5 w-5 sm:h-4 sm:w-4 fill-current" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Remove"
            className="inline-flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-40 select-none"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
