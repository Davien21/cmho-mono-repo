import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { InventoryList } from "@/components/InventoryList";
import { UpdateStockModal } from "@/components/modals/UpdateStockModal";
import { EditInventoryModal } from "@/components/modals/EditInventoryModal";
import { InventoryItem } from "@/types/inventory";
import Layout from "@/components/Layout";
import {
  IInventoryItemDto,
  useGetInventoryItemsQuery,
} from "@/store/inventory-slice";

export default function InventoryPage() {
  const { data, isLoading } = useGetInventoryItemsQuery();

  const items: InventoryItem[] = useMemo(() => {
    const dtos: IInventoryItemDto[] = data?.data || [];
    return dtos.map((dto) => ({
      id: dto._id,
      name: dto.name,
      description: "",
      category: dto.category,
      inventoryCategory: dto.category,
      units: (dto.units || []).map((u) => ({
        id: u.id,
        name: u.name,
        plural: u.plural,
        quantity: u.quantity,
      })),
      lowStockValue: dto.lowStockValue,
      status: dto.setupStatus,
      stocks: [],
      currentStockInBaseUnits: dto.currentStockInBaseUnits,
      earliestExpiryDate: dto.earliestExpiryDate ?? null,
    }));
  }, [data]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const navigate = useNavigate();

  const handleUpdateStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowStockModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: InventoryItem) => {
    // Delete will be handled once wired to backend mutation
    window.alert(
      `Delete for "${item.name}" will be available once wired to backend mutation.`
    );
  };

  const handleViewStockEntries = (item: InventoryItem) => {
    navigate(`/inventory/stock?itemId=${encodeURIComponent(item.id)}`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage the hospital inventory
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Inventory Items
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <Button onClick={() => setShowAddForm(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            Loading inventory items...
          </div>
        ) : (
          <InventoryList
            items={items}
            onUpdateStock={handleUpdateStock}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewStockEntries={handleViewStockEntries}
          />
        )}

        {showAddForm && (
          <AddInventoryModal onClose={() => setShowAddForm(false)} />
        )}

        {showEditModal && selectedItem && (
          <EditInventoryModal
            item={selectedItem}
            onClose={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
          />
        )}

        {showStockModal && selectedItem && (
          <UpdateStockModal
            inventoryItem={selectedItem}
            onClose={() => {
              setShowStockModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
