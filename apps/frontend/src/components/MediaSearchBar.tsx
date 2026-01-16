import {
  Search,
  Trash2,
  List,
  Grid3x3,
  CheckSquare,
  MousePointer2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface MediaSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  showCheckboxes: boolean;
  onCheckboxToggle: () => void;
  selectedCount?: number;
  isDeleting?: boolean;
  onDeleteSelected?: () => void;
}

export function MediaSearchBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showCheckboxes,
  onCheckboxToggle,
  selectedCount = 0,
  isDeleting = false,
  onDeleteSelected,
}: MediaSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      {/* Search Bar */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onViewModeChange(viewMode === "grid" ? "list" : "grid")}
          title={viewMode === "grid" ? "List view" : "Grid view"}
        >
          {viewMode === "grid" ? (
            <List className="h-4 w-4" />
          ) : (
            <Grid3x3 className="h-4 w-4" />
          )}
        </Button>

        {/* Selection Mode Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onCheckboxToggle}
          title={showCheckboxes ? "Exit select mode" : "Select items"}
        >
          {showCheckboxes ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <MousePointer2 className="h-4 w-4" />
          )}
        </Button>

        {/* Delete Selected Button */}
        {showCheckboxes && selectedCount > 0 && onDeleteSelected && (
          <Button
            variant="destructive"
            size="icon"
            onClick={onDeleteSelected}
            disabled={isDeleting}
            title={`Delete ${selectedCount} selected`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

