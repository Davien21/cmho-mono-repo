import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ISupplierDto, useGetSuppliersQuery } from '@/store/inventory-slice';

interface InventorySupplierSelectProps {
  id?: string;
  value: string | null;
  onChange: (supplier: { id: string; name: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
}

export function InventorySupplierSelect({
  id,
  value,
  onChange,
  placeholder = 'Select a supplier',
  disabled,
  errorMessage,
}: InventorySupplierSelectProps) {
  const { data, isLoading, isError } = useGetSuppliersQuery();

  const suppliers: ISupplierDto[] = (data?.data || []).filter((sup) => sup.status === 'active');

  const handleChange = (supplierId: string) => {
    const sup = suppliers.find((s) => s._id === supplierId) || null;
    if (!sup) {
      onChange(null);
      return;
    }
    onChange({ id: sup._id, name: sup.name });
  };

  return (
    <div className="space-y-1">
      <Select
        value={value ?? undefined}
        onValueChange={handleChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              Loading suppliers...
            </div>
          ) : isError ? (
            <div className="px-3 py-2 text-sm text-destructive text-center">
              Failed to load suppliers
            </div>
          ) : suppliers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              No suppliers have been set up
            </div>
          ) : (
            suppliers.map((sup) => (
              <SelectItem key={sup._id} value={sup._id}>
                {sup.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
    </div>
  );
}
