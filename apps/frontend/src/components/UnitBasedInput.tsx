import { useMemo } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Label } from "./ui/label";
import { UnitLevel } from "@/types/inventory";
import { formatUnitName } from "@/lib/utils";

interface QuantityInput {
  unitId: string;
  value: string;
}

interface UnitBasedInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  units: UnitLevel[];
  label?: string;
  error?: string;
}

interface QuantityInputProps {
  value: string;
  onChange: (value: string) => void;
  displayName: string;
  showPlus: boolean;
}

function QuantityInput({
  value,
  onChange,
  displayName,
  showPlus,
}: QuantityInputProps) {
  // Calculate width based on character count
  // Base width: 30px for 1 character
  // Each additional character (from 2nd onwards): +20px
  // Max 4 characters
  const getWidth = () => {
    const charCount = value ? value.length : 0;
    const baseWidth = 40; // Starting width

    if (charCount <= 1) return baseWidth;

    const extraChars = Math.min(charCount - 1, 3); // Max 3 extra chars (2nd, 3rd, 4th)
    const baseIncrement = extraChars * 8;
    // Add extra 2px for the 4th character
    const extraIncrement = charCount >= 4 ? 2 : 0;
    return baseWidth + baseIncrement + extraIncrement;
  };

  const width = getWidth();

  return (
    <div className="flex items-center gap-3">
      {showPlus && (
        <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
          +
        </span>
      )}

      <div className="flex items-center bg-neutral-100 rounded-md">
        <input
          type="tel"
          step="1"
          min="0"
          placeholder="-"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          style={{ width: `${width}px` }}
          className="text-sm border-0 bg-transparent py-1.5 pl-3 pr-2 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none transition-all outline-none"
        />
        <span className="text-sm pr-3 text-foreground font-medium">
          {displayName}
        </span>
      </div>
    </div>
  );
}

export function UnitBasedInput<T extends FieldValues>({
  control,
  name,
  units,
  label,
  error,
}: UnitBasedInputProps<T>) {
  const sortedUnits = useMemo(() => {
    // Filter out units with falsy names and maintain order
    // Show all units that have a name, regardless of whether they have a quantity
    return units.filter((unit) => unit.name);
  }, [units]);

  const getBaseUnit = () => {
    // Base unit is the last unit in the filtered array
    return sortedUnits.length > 0 ? sortedUnits[sortedUnits.length - 1] : null;
  };

  const calculateTotalInBaseUnits = (quantityInputs: QuantityInput[]) => {
    if (!sortedUnits.length) return 0;

    let total = 0;

    sortedUnits.forEach((unit, unitIndex) => {
      const input = quantityInputs.find((qi) => qi.unitId === unit.id);
      const qty = parseFloat(input?.value || "0");

      if (qty <= 0) return;

      // Calculate multiplier for this unit to base unit
      // Multiply all child unit quantities (units that come after this one)
      let multiplier = 1;
      for (let i = unitIndex + 1; i < sortedUnits.length; i++) {
        multiplier *= sortedUnits[i].quantity || 1;
      }

      total += qty * multiplier;
    });

    return total;
  };

  const baseUnit = getBaseUnit();

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          // Initialize quantity inputs if not already set or if units have changed
          const currentInputs: QuantityInput[] = field.value || [];
          const hasAllUnits = sortedUnits.every((unit) =>
            currentInputs.some((qi) => qi.unitId === unit.id)
          );

          let quantityInputs: QuantityInput[];
          if (!hasAllUnits || currentInputs.length !== sortedUnits.length) {
            // Initialize or update quantity inputs based on current units (only those with names)
            quantityInputs = sortedUnits.map((unit) => {
              const existing = currentInputs.find(
                (qi) => qi.unitId === unit.id
              );
              return existing || { unitId: unit.id, value: "0" };
            });
            // Only update if there's a change to avoid infinite loops
            if (
              JSON.stringify(quantityInputs) !== JSON.stringify(currentInputs)
            ) {
              field.onChange(quantityInputs);
            }
          } else {
            // Filter out quantity inputs for units without names
            quantityInputs = currentInputs.filter((qi) =>
              sortedUnits.some((unit) => unit.id === qi.unitId)
            );
          }

          const updateQuantityInput = (unitId: string, value: string) => {
            const updated = quantityInputs.map((qi) =>
              qi.unitId === unitId ? { ...qi, value } : qi
            );
            field.onChange(updated);
          };

          const totalInBaseUnits = calculateTotalInBaseUnits(quantityInputs);

          return (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                {sortedUnits.map((unit, idx) => {
                  const input = quantityInputs.find(
                    (qi) => qi.unitId === unit.id
                  );
                  const inputValue = input?.value ?? "";
                  const displayName = formatUnitName(unit, inputValue || "0");

                  return (
                    <QuantityInput
                      key={unit.id}
                      value={inputValue}
                      onChange={(value) => updateQuantityInput(unit.id, value)}
                      displayName={displayName}
                      showPlus={idx > 0}
                    />
                  );
                })}
              </div>

              {totalInBaseUnits > 0 && baseUnit && (
                <p className="text-sm text-muted-foreground">
                  Total:{" "}
                  <span className="font-medium text-foreground">
                    {totalInBaseUnits}{" "}
                    {formatUnitName(baseUnit, totalInBaseUnits)}
                  </span>
                </p>
              )}

              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
