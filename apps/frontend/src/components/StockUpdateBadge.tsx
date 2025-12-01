import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { UnitLevel } from "@/types/inventory";
import { formatUnitName } from "@/lib/utils";

type DisplayMode = "full" | "skipOne" | "baseOnly";

interface StockUpdateBadgeProps
  extends Omit<React.ComponentProps<typeof Badge>, "children"> {
  units: UnitLevel[];
  /**
   * Quantity in base units. Can be negative; component will show +/-.
   */
  quantityInBaseUnits: number;
  operationType: "add" | "reduce";
}

export function StockUpdateBadge({
  units,
  quantityInBaseUnits,
  operationType,
  className,
  ...props
}: StockUpdateBadgeProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full");

  const getBaseUnitName = (allUnits: UnitLevel[], quantity: number = 2) => {
    const baseUnit = allUnits.length > 0 ? allUnits[allUnits.length - 1] : null;
    if (!baseUnit) return "units";
    return formatUnitName(baseUnit, quantity);
  };

  const convertBaseUnitsToRepresentation = (
    allUnits: UnitLevel[],
    totalInBaseUnits: number,
    mode: DisplayMode
  ): string => {
    if (totalInBaseUnits === 0) return `0 ${getBaseUnitName(allUnits, 0)}`;

    if (allUnits.length === 0)
      return `${totalInBaseUnits} ${getBaseUnitName(
        allUnits,
        totalInBaseUnits
      )}`;

    const baseUnit = allUnits.length > 0 ? allUnits[allUnits.length - 1] : null;

    if (mode === "baseOnly") {
      return `${totalInBaseUnits} ${
        baseUnit ? formatUnitName(baseUnit, totalInBaseUnits) : "units"
      }`;
    }

    const sortedUnits = allUnits;
    const unitMultipliers = new Map<string, number>();

    sortedUnits.forEach((unit, unitIndex) => {
      let multiplier = 1;
      for (let i = unitIndex + 1; i < sortedUnits.length; i++) {
        const qty = sortedUnits[i].quantity;
        const numQty = typeof qty === "string" ? parseFloat(qty) : Number(qty);
        if (!isNaN(numQty) && numQty > 0) {
          multiplier *= numQty;
        }
      }
      unitMultipliers.set(unit.id, multiplier);
    });

    let unitsToUse = [...sortedUnits];
    if (mode === "skipOne" && sortedUnits.length > 1) {
      unitsToUse = sortedUnits.slice(1);
    }

    let remaining = totalInBaseUnits;
    const result: { unit: UnitLevel; quantity: number }[] = [];

    unitsToUse.forEach((unit) => {
      const multiplier = unitMultipliers.get(unit.id) || 1;
      if (multiplier > 1) {
        const quantity = Math.floor(remaining / multiplier);
        if (quantity > 0) {
          result.push({ unit, quantity });
          remaining -= quantity * multiplier;
        }
      }
    });

    if (remaining > 0 && baseUnit) {
      result.push({ unit: baseUnit, quantity: remaining });
    }

    return result
      .map((r) => `${r.quantity} ${formatUnitName(r.unit, r.quantity)}`)
      .join(", ");
  };

  const toggleDisplayMode = () => {
    setDisplayMode((current) => {
      if (current === "full") return "skipOne";
      if (current === "skipOne") return "baseOnly";
      return "full";
    });
  };

  const absoluteQuantity = Math.abs(quantityInBaseUnits);
  const formattedQuantity = convertBaseUnitsToRepresentation(
    units,
    absoluteQuantity,
    displayMode
  );

  const prefix = operationType === "add" ? "+" : "-";

  const colorClass =
    operationType === "add"
      ? "bg-green-100 text-green-800 hover:bg-green-200"
      : "bg-red-100 text-red-800 hover:bg-red-200";

  return (
    <Badge
      className={`${colorClass} cursor-pointer ${className ?? ""}`}
      title="Click to toggle display format"
      onClick={(e) => {
        toggleDisplayMode();
        props.onClick?.(e);
      }}
      {...props}
    >
      {`${prefix} ${formattedQuantity}`}
    </Badge>
  );
}
