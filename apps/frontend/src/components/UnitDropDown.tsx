import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UnitDropdownProps {
  unitId: string;
  value: string;
  units?: string[];
  className?: string;
  maxHeight?: number | string;
  onSelect: (unitId: string, value: string) => void;
}

const UnitDropdown = React.memo(
  ({ unitId, value, units = [], className, maxHeight = 180, onSelect }: UnitDropdownProps) => {
    return (
      <Select value={value} onValueChange={(newValue) => onSelect(unitId, newValue)}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Pick unit" />
        </SelectTrigger>
        <SelectContent
          style={{
            maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          }}
        >
          {units.map((unitName) => (
            <SelectItem key={unitName} value={unitName}>
              {unitName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

UnitDropdown.displayName = 'UnitDropdown';

export { UnitDropdown };
