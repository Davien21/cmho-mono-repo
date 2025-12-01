import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { InventoryList } from "@/components/InventoryList";
import { UpdateStockModal } from "@/components/modals/UpdateStockModal";
import { EditInventoryModal } from "@/components/modals/EditInventoryModal";
import { InventoryItem } from "@/types/inventory";
import { storageService } from "@/lib/inventory-storage";
import Layout from "@/components/Layout";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadedItems = storageService.getItems();
    setItems(loadedItems);
  }, []);

  const handleSaveItem = (item: InventoryItem) => {
    storageService.saveItem(item);
    setItems([...storageService.getItems()]);
    setShowAddForm(false);
  };

  const handleUpdateStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowStockModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleEditSaved = () => {
    setItems([...storageService.getItems()]);
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const handleStockSaved = () => {
    setItems([...storageService.getItems()]);
    setShowStockModal(false);
    setSelectedItem(null);
  };

  const handleDelete = (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      storageService.deleteItem(item.id);
      setItems([...storageService.getItems()]);
    }
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

        <InventoryList
          items={items}
          onUpdateStock={handleUpdateStock}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewStockEntries={handleViewStockEntries}
        />

        {showAddForm && (
          <AddInventoryModal
            onClose={() => setShowAddForm(false)}
            onSave={handleSaveItem}
          />
        )}

        {showEditModal && selectedItem && (
          <EditInventoryModal
            item={selectedItem}
            onClose={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
            onSave={handleEditSaved}
          />
        )}

        {showStockModal && selectedItem && (
          <UpdateStockModal
            inventoryItemId={selectedItem.id}
            onClose={() => {
              setShowStockModal(false);
              setSelectedItem(null);
            }}
            onSave={handleStockSaved}
          />
        )}
      </div>
    </Layout>
  );
}
