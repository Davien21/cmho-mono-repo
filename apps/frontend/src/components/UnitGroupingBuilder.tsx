import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { UnitLevel } from "@/types/inventory";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { useCallback } from "react";
import { UnitDropdown } from "./UnitDropDown";
import { getPackageUnitNames } from "@/lib/inventory-defaults";

interface UnitGroupingBuilderProps {
  units: UnitLevel[];
  onChange: (units: UnitLevel[]) => void;
  initialUnits?: UnitLevel[];
}

export function UnitGroupingBuilder({
  units,
  onChange,
  initialUnits = [],
}: UnitGroupingBuilderProps) {
  const addLevel = () => {
    const newUnit: UnitLevel = {
      id: crypto.randomUUID(),
      name: "",
      quantity: "",
      plural: "",
    };
    onChange([...units, newUnit]);
  };

  const resetUnits = () => {
    onChange([...initialUnits]);
  };

  const updateUnit = useCallback(
    (id: string, updates: Partial<UnitLevel>) => {
      onChange(units.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    },
    [units, onChange]
  );

  const handleUnitSelect = useCallback(
    (unitId: string, value: string) => {
      updateUnit(unitId, { name: value });
    },
    [updateUnit]
  );

  const removeUnit = (id: string) => {
    onChange(units.filter((u) => u.id !== id));
  };

  // Units are already in the correct order in the array
  const sortedUnits = units;

  const rootUnit = sortedUnits[0];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Packaging Structure</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetUnits}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLevel}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!!sortedUnits.length && (
            <>
              <ContextMenu>
                <ContextMenuTrigger>
                  <div className="flex items-center bg-neutral-100 rounded-md">
                    <span className="text-sm pl-3 pr-2 text-muted-foreground font-medium">
                      1
                    </span>
                    <UnitDropdown
                      units={PREDEFINED_UNITS}
                      unitId={rootUnit.id}
                      value={rootUnit?.name || ""}
                      className="w-24 text-sm border-0 bg-transparent py-1.5 pr-3 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 shadow-none"
                      maxHeight={180}
                      onSelect={handleUnitSelect}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => removeUnit(rootUnit.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {sortedUnits.slice(1).map((unit) => {
                return (
                  <ContextMenu key={unit.id}>
                    <ContextMenuTrigger>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
                          is
                        </span>

                        <div className="flex items-center bg-neutral-100 rounded-md">
                          <input
                            type="text"
                            value={unit.quantity}
                            onChange={(e) =>
                              updateUnit(unit.id, { quantity: e.target.value })
                            }
                            placeholder="-"
                            className="w-8 text-sm border-0 bg-transparent py-1.5 pl-3 pr-1 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                          />

                          <span className="text-muted-foreground mx-1.5 text-sm">
                            ×
                          </span>

                          <UnitDropdown
                            units={PREDEFINED_UNITS}
                            unitId={unit.id}
                            value={unit.name || ""}
                            className="w-24 text-sm border-0 bg-transparent py-1.5 pr-3 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 shadow-none"
                            maxHeight={180}
                            onSelect={handleUnitSelect}
                          />
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => removeUnit(unit.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const PREDEFINED_UNITS = getPackageUnitNames();
