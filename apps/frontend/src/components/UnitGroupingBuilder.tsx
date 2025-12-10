import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { UnitLevel } from "@/types/inventory";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { useCallback, useMemo } from "react";
import { UnitDropdown } from "./UnitDropDown";
import { IInventoryUnitDefinitionDto } from "@/store/inventory-slice";

interface UnitGroupingBuilderProps {
  units: UnitLevel[];
  onChange: (units: UnitLevel[]) => void;
  /**
   * The original preset units for this item/category.
   * Used solely for the "Reset" action so we can always go back
   * to the initial configuration regardless of user edits.
   */
  initialUnits: UnitLevel[];
  /**
   * Available unit presets with name and plural.
   * Used to populate the unit dropdowns and auto-fill plurals when a unit is selected.
   */
  presets: IInventoryUnitDefinitionDto[];
}

export function UnitGroupingBuilder({
  units,
  onChange,
  initialUnits,
  presets,
}: UnitGroupingBuilderProps) {
  // Sort presets by order (ascending), then by name as fallback
  const sortedPresets = useMemo(() => {
    return [...presets].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [presets]);
  // Derive unit names from sorted presets for the dropdown
  const availableUnitNames = useMemo(
    () => sortedPresets.map((p) => p.name),
    [sortedPresets]
  );
  const addLevel = () => {
    const newUnit: UnitLevel = {
      id: crypto.randomUUID(),
      name: "",
      quantity: undefined,
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
      // Look up the preset from sorted presets
      const preset = sortedPresets.find((p) => p.name === value);
      const updates: Partial<UnitLevel> = {
        name: value,
        // Update the id to match the preset's ObjectId
        ...(preset ? { id: preset._id, plural: preset.plural } : {}),
      };
      updateUnit(unitId, updates);
    },
    [updateUnit, sortedPresets]
  );

  const removeUnit = (id: string) => {
    onChange(units.filter((u) => u.id !== id));
  };

  // Calculate width based on character count (same logic as UnitBasedInput)
  const getInputWidth = (value: number | undefined) => {
    const valueStr = value?.toString() || "";
    const charCount = valueStr.length;
    const baseWidth = 26; // Starting width

    if (charCount <= 1) return baseWidth;

    const extraChars = Math.min(charCount - 1, 3); // Max 3 extra chars (2nd, 3rd, 4th)
    const baseIncrement = extraChars * 8;
    // Add extra 2px for the 4th character
    const extraIncrement = charCount >= 4 ? 2 : 0;
    return baseWidth + baseIncrement + extraIncrement;
  };

  // Units are already in the correct order in the array
  const sortedUnits = units;

  const rootUnit = sortedUnits[0];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
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
                      units={availableUnitNames}
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
                            type="tel"
                            step="1"
                            min="0"
                            value={unit.quantity ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue =
                                value === "" ? undefined : parseFloat(value);
                              updateUnit(unit.id, {
                                quantity:
                                  numValue !== undefined &&
                                  !isNaN(numValue) &&
                                  numValue > 0
                                    ? numValue
                                    : undefined,
                              });
                            }}
                            placeholder="-"
                            autoComplete="off"
                            style={{
                              width: `${getInputWidth(unit.quantity)}px`,
                            }}
                            className="text-sm border-0 bg-transparent py-1.5 pl-3 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none transition-all outline-none"
                          />

                          <span className="text-muted-foreground mx-1.5 text-sm">
                            ×
                          </span>

                          <UnitDropdown
                            units={availableUnitNames}
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
