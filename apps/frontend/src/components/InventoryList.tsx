import { useState } from 'react';
import { Search, Package, Edit2, PackagePlus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { InventoryItem } from '@/types/inventory';

interface InventoryListProps {
  items: InventoryItem[];
  onUpdateStock: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
}

export function InventoryList({ items, onUpdateStock, onEdit }: InventoryListProps) {
  const [search, setSearch] = useState('');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getTotalStock = (item: InventoryItem): number => {
    if (!item.stocks || item.stocks.length === 0) return 0;
    return item.stocks.reduce((sum, stock) => sum + stock.quantityInBaseUnits, 0);
  };

  const getBaseUnitName = (item: InventoryItem): string => {
    const baseUnit = item.grouping?.units.find(u => u.id === item.grouping?.baseUnitId);
    return baseUnit?.name || 'units';
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="border rounded-lg p-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No items found</p>
            <p className="text-sm">
              {search ? 'Try adjusting your search' : 'Add your first inventory item to get started'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.inventoryType === 'Custom' ? item.customInventoryType : item.inventoryType}
                      </p>
                    </div>
                    <Badge
                      variant={item.status === 'ready' ? 'default' : 'secondary'}
                      className={
                        item.status === 'ready'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">
                      Stock: <span className="font-semibold text-gray-900">{getTotalStock(item)}</span> {getBaseUnitName(item)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="flex-1 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => onUpdateStock(item)}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Add Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {item.inventoryType === 'Custom' ? item.customInventoryType : item.inventoryType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">{getTotalStock(item)}</span>{' '}
                        <span className="text-gray-500">{getBaseUnitName(item)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={item.status === 'ready' ? 'default' : 'secondary'}
                        className={
                          item.status === 'ready'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => onEdit(item)}
                          className="bg-transparent shadow-none p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onUpdateStock(item)}
                          className="bg-green-100 shadow-none p-2 text-green-700 hover:text-green-800 hover:bg-green-200 rounded-lg transition-colors"
                          title="Add stock"
                        >
                          <PackagePlus className="w-4 h-4" />
                          Add Stock
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

