import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  IInventoryCategoryDto,
  useGetInventoryCategoriesQuery,
} from "@/store/inventory-slice";

interface InventoryCategorySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
  clearable?: boolean;
  onClear?: () => void;
}

export function InventoryCategorySelect({
  id,
  value,
  onChange,
  placeholder = "Select a category",
  disabled,
  errorMessage,
  clearable = false,
  onClear,
}: InventoryCategorySelectProps) {
  const { data, isLoading, isError } = useGetInventoryCategoriesQuery();
  // Sort categories by order (ascending), then by name as fallback
  // Create a copy of the array before sorting to avoid mutating the read-only array from RTK Query
  const categories: IInventoryCategoryDto[] = [...(data?.data || [])].sort(
    (a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    }
  );

  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className="space-y-1">
      <Select
        key={value || "empty"}
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id={id}
          showClear={clearable && !!value}
          onClear={handleClear}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              Loading categories...
            </div>
          ) : isError ? (
            <div className="px-3 py-2 text-sm text-destructive text-center">
              Failed to load categories
            </div>
          ) : categories.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              No categories have been set up
            </div>
          ) : (
            categories.map((category) => (
              <SelectItem key={category._id} value={category.name}>
                {category.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
