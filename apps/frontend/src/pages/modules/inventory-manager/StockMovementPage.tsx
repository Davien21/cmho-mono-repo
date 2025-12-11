import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { UnitLevel } from "@/types/inventory";
import { StockUpdateBadge } from "@/components/StockUpdateBadge";
import { Pagination } from "@/components/Pagination";
import {
  IInventoryItemDto,
  IStockMovementDto,
  useGetInventoryItemsQuery,
  useGetStockMovementQuery,
} from "@/store/inventory-slice";

// Flattened display structure for the table
interface StockChangeRow {
  id: string;
  inventoryItemId: string;
  operationType: "add" | "reduce";
  supplier: string | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  quantityInBaseUnits: number;
  balance: number;
  createdAt: string;
  performedBy: string;
  itemName: string;
  units: UnitLevel[];
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExpiryDate(dateString: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  // Format as "MMM YYYY" (e.g., "Mar 2024")
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

// Key for localStorage
const STOCK_PAGINATION_STORAGE_KEY = "stockMovementPaginationPrefs";

// Load pagination preferences from localStorage
const loadStockPaginationPrefs = (): { pageSize: number } => {
  try {
    const stored = localStorage.getItem(STOCK_PAGINATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { pageSize: parsed.pageSize || 10 };
    }
  } catch (error) {
    console.error("Failed to load pagination preferences:", error);
  }
  return { pageSize: 10 };
};

// Save pagination preferences to localStorage
const saveStockPaginationPrefs = (prefs: { pageSize: number }) => {
  try {
    localStorage.setItem(STOCK_PAGINATION_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("Failed to save pagination preferences:", error);
  }
};

export default function StockMovementPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [searchInitialized, setSearchInitialized] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StockChangeRow | null>(null);
  const previousFilterItemIdRef = useRef<string | null>(null);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const isSearchingRef = useRef(false);

  // Pagination state with localStorage persistence
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    () => loadStockPaginationPrefs().pageSize
  );

  const filterItemId = searchParams.get("itemId");
  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterItemId, debouncedSearch]);

  const { data: itemsResponse } = useGetInventoryItemsQuery({});

  const {
    data: stockMovementResponse,
    isLoading,
    isFetching,
  } = useGetStockMovementQuery({
    inventoryItemId: filterItemId || undefined,
    sort: "desc",
    search: debouncedSearch.trim() || undefined,
    page: currentPage,
    limit: pageSize,
  });

  const items = useMemo(() => {
    const dtos: IInventoryItemDto[] = itemsResponse?.data?.data || [];
    return dtos.map((dto) => ({
      id: dto._id,
      name: dto.name,
      description: "",
      category: dto.category,
      units: (dto.units || []).map((u) => ({
        id: u.id,
        name: u.name,
        plural: u.plural,
        quantity: u.quantity,
      })),
      lowStockValue: dto.lowStockValue,
      currentStockInBaseUnits: dto.currentStockInBaseUnits,
      image: dto.image,
    }));
  }, [itemsResponse]);

  const filteredItem = useMemo(
    () => items.find((item) => item.id === filterItemId) ?? null,
    [items, filterItemId]
  );

  useEffect(() => {
    if (filteredItem && !searchInitialized) {
      // Seed the search input with the filtered item's name
      // when arriving from a specific inventory item.
      setSearch(filteredItem.name);
      setSearchInitialized(true);
    } else if (!filterItemId && searchInitialized) {
      // When there's no item filter in the URL anymore (e.g. user clicked
      // the "Stock" breadcrumb to view all stock), clear the seeded search.
      setSearch("");
      setSearchInitialized(false);
    }
  }, [filteredItem, filterItemId, searchInitialized]);

  // Reset search flag when fetch completes
  useEffect(() => {
    if (!isFetching && isSearchingRef.current) {
      isSearchingRef.current = false;
    }
  }, [isFetching]);

  // Track search changes
  useEffect(() => {
    if (previousSearchRef.current !== debouncedSearch) {
      previousSearchRef.current = debouncedSearch;
      isSearchingRef.current = true;
    }
  }, [debouncedSearch]);

  // Track filter changes
  useEffect(() => {
    if (previousFilterItemIdRef.current !== filterItemId) {
      previousFilterItemIdRef.current = filterItemId;
    }
  }, [filterItemId]);

  const rows: StockChangeRow[] = useMemo(() => {
    const itemById = new Map<string, { name: string; units: UnitLevel[] }>();
    items.forEach((item) => {
      itemById.set(item.id, { name: item.name, units: item.units || [] });
    });

    const entries: IStockMovementDto[] =
      stockMovementResponse?.data?.data || [];

    const all: StockChangeRow[] = entries.map((entry) => {
      const meta = itemById.get(entry.inventoryItem.id);
      return {
        id: entry._id,
        inventoryItemId: entry.inventoryItem.id,
        operationType: entry.operationType,
        supplier: entry.supplier?.name ?? null,
        costPrice: entry.prices?.costPrice ?? 0,
        sellingPrice: entry.prices?.sellingPrice ?? 0,
        expiryDate: entry.expiryDate.toString(),
        quantityInBaseUnits: entry.quantityInBaseUnits,
        balance: entry.balance,
        createdAt: entry.createdAt
          ? entry.createdAt.toString()
          : new Date().toISOString(),
        performedBy: entry.performer.name || "Admin",
        itemName: entry.inventoryItem.name,
        units: meta?.units || [],
      };
    });

    return all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items, stockMovementResponse]);

  // Pagination metadata
  const totalItems = stockMovementResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    saveStockPaginationPrefs({ pageSize: newPageSize });
  };

  // No client-side filtering needed - search is handled by API
  const filteredRows = rows;

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Stock Movement
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            {filteredItem
              ? `All stock movement for "${filteredItem.name}".`
              : "All stock movement across inventory items."}
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name or operator..."
            className="pl-8 pr-8"
          />
          {(isLoading || (isFetching && isSearchingRef.current)) && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {isLoading ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-foreground">
              Loading stock movement...
            </p>
          </Card>
        ) : rows.length === 0 && !isFetching ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-foreground">
              {debouncedSearch
                ? `No stock movement found for "${debouncedSearch}"`
                : "No stock movement yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try adjusting your search terms"
                : "Use the inventory actions to add or reduce stock."}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <Card
                  key={row.id}
                  className="bg-white rounded-lg p-4 border border-gray-100 cursor-pointer"
                  onClick={() => setSelectedRow(row)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {row.itemName}
                        </span>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <StockUpdateBadge
                            units={row.units}
                            quantityInBaseUnits={row.quantityInBaseUnits}
                            operationType={row.operationType}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                        <span>{formatDateTime(row.createdAt)}</span>
                        <span>•</span>
                        <span>by {row.performedBy}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination controls */}
            {rows.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isFetching}
              />
            )}
          </>
        )}
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Stock Movement Details
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(selectedRow.createdAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRow(null)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium text-right">
                  {selectedRow.itemName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <StockUpdateBadge
                  units={selectedRow.units}
                  quantityInBaseUnits={selectedRow.quantityInBaseUnits}
                  operationType={selectedRow.operationType}
                />
              </div>
              {selectedRow.operationType !== "reduce" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cost Price</span>
                    <span className="font-medium">
                      ₦
                      {selectedRow.costPrice.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Selling Price</span>
                    <span className="font-medium">
                      ₦
                      {selectedRow.sellingPrice.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <span className="font-medium">
                      {formatExpiryDate(selectedRow.expiryDate)}
                    </span>
                  </div>
                </>
              )}
              {selectedRow.operationType === "reduce" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expiry Date</span>
                  <span className="font-medium">
                    {formatExpiryDate(selectedRow.expiryDate)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Performed by</span>
                <span className="font-medium">{selectedRow.performedBy}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
