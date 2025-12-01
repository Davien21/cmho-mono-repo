import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InventoryQtyLevelBadgeProps
  extends React.ComponentProps<typeof Badge> {
  low?: boolean;
}

export function InventoryQtyLevelBadge({
  low,
  className,
  ...props
}: InventoryQtyLevelBadgeProps) {
  const baseClass = low
    ? "bg-red-100 text-red-800 hover:bg-red-200"
    : "bg-gray-100 text-gray-800 hover:bg-gray-200";

  return <Badge className={cn(baseClass, className)} {...props} />;
}
