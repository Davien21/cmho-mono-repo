import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PackageOpen } from "lucide-react";

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InventoryItem, StockEntry } from "@/types/inventory";
import { storageService } from "@/lib/inventory-storage";
import { StockUpdateBadge } from "@/components/StockUpdateBadge";

export default function StockEntriesPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const items = storageService.getItems();
    const found = items.find((i) => i.id === itemId) ?? null;
    setItem(found);
  }, [itemId]);

  const sortedEntries: StockEntry[] = useMemo(() => {
    if (!item?.stocks) return [];
    return [...item.stocks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [item]);

  const handleBack = () => {
    navigate("/inventory");
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stock Changes</h2>
          <p className="mt-1 text-sm text-gray-600">
            {item
              ? `Viewing stock changes for "${item.name}".`
              : "Viewing stock changes."}
          </p>
        </div>

        {!item ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <PackageOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">
              Inventory item not found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The requested inventory item could not be located.
            </p>
            <Button className="mt-4" onClick={handleBack}>
              Go back
            </Button>
          </Card>
        ) : sortedEntries.length === 0 ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <PackageOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">
              No stock changes yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the inventory actions to add stock for this item.
            </p>
            <Button className="mt-4" onClick={handleBack}>
              Back to Inventory
            </Button>
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
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed by
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <StockUpdateBadge
                            units={item.units || []}
                            quantityInBaseUnits={entry.quantityInBaseUnits}
                            operationType={entry.operationType}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {entry.performedBy || "Admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 space-y-2 cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium text-foreground">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <StockUpdateBadge
                            units={item.units || []}
                            quantityInBaseUnits={entry.quantityInBaseUnits}
                            operationType={entry.operationType}
                          />
                        </div>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Performed by</p>
                      <p className="font-medium text-foreground">
                        {entry.performedBy || "Admin"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {selectedEntry && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Stock Change Details</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(selectedEntry.createdAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEntry(null)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium text-right">{item.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <StockUpdateBadge
                  units={item.units || []}
                  quantityInBaseUnits={selectedEntry.quantityInBaseUnits}
                  operationType={selectedEntry.operationType}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cost Price</span>
                <span className="font-medium">
                  ₦
                  {selectedEntry.costPrice.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-medium">
                  ₦
                  {selectedEntry.sellingPrice.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expiry Date</span>
                <span className="font-medium">{selectedEntry.expiryDate}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
