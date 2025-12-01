import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { InventoryItem, StockEntry, UnitLevel } from "@/types/inventory";
import { storageService } from "@/lib/inventory-storage";
import { StockUpdateBadge } from "@/components/StockUpdateBadge";

type StockChangeRow = StockEntry & {
  itemName: string;
  units: UnitLevel[];
};

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

export default function StockChangesPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [searchInitialized, setSearchInitialized] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StockChangeRow | null>(null);

  useEffect(() => {
    const loadedItems = storageService.getItems();
    setItems(loadedItems);
  }, []);

  const filterItemId = searchParams.get("itemId");

  const filteredItem = useMemo(
    () => items.find((item) => item.id === filterItemId) ?? null,
    [items, filterItemId]
  );

  useEffect(() => {
    if (filteredItem && !searchInitialized) {
      setSearch(filteredItem.name);
      setSearchInitialized(true);
    }
  }, [filteredItem, searchInitialized]);

  const rows: StockChangeRow[] = useMemo(() => {
    const all: StockChangeRow[] = [];
    items.forEach((item) => {
      if (filterItemId && item.id !== filterItemId) {
        return;
      }
      (item.stocks || []).forEach((entry) => {
        all.push({
          ...entry,
          itemName: item.name,
          units: item.units || [],
        });
      });
    });

    return all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items, filterItemId]);

  const filteredRows: StockChangeRow[] = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const haystack = `${row.itemName} ${
        row.performedBy || ""
      } ${formatDateTime(row.createdAt)}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, search]);

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Stock</h2>
            <p className="mt-1 text-sm text-gray-600">
              {filteredItem
                ? `All stock changes for "${filteredItem.name}".`
                : "All stock changes across inventory items."}
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item or operator..."
              className="pl-8"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-foreground">
              No stock changes yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the inventory actions to add or reduce stock.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time of Update
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed by
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-sm text-muted-foreground"
                      >
                        No stock changes match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {row.itemName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
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
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {row.performedBy || "Admin"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {filteredRows.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No stock changes match your search.
                </div>
              ) : (
                filteredRows.map((row) => (
                  <div
                    key={row.id}
                    className="p-4 space-y-2 cursor-pointer"
                    onClick={() => setSelectedRow(row)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {formatDateTime(row.createdAt)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Item</p>
                        <p className="font-medium text-foreground">
                          {row.itemName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium text-foreground">
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
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiry Date</p>
                        <p className="font-medium text-foreground">
                          {row.expiryDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost Price</p>
                        <p className="font-medium text-foreground">
                          ₦
                          {row.costPrice.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Selling Price</p>
                        <p className="font-medium text-foreground">
                          ₦
                          {row.sellingPrice.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Performed by</p>
                        <p className="font-medium text-foreground">
                          {row.performedBy || "Admin"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Stock Change Details</h3>
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
                <span className="font-medium">{selectedRow.expiryDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Performed by</span>
                <span className="font-medium">
                  {selectedRow.performedBy || "Admin"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
