import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { InventoryList } from "@/components/InventoryList";
import { UpdateStockModal } from "@/components/modals/UpdateStockModal";
import { EditInventoryModal } from "@/components/modals/EditInventoryModal";
import { InventoryItem } from "@/types/inventory";
import Layout from "@/components/Layout";
import {
  IInventoryItemDto,
  useGetInventoryItemsQuery,
  useDeleteInventoryItemMutation,
} from "@/store/inventory-slice";
import { useModalContext } from "@/contexts/modal-context";
import { toast } from "sonner";
import { getRTKQueryErrorMessage } from "@/lib/utils";

export default function InventoryPage() {
  const { data, isLoading } = useGetInventoryItemsQuery();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();
  const { openModal, closeModal } = useModalContext();

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
      image: dto.image,
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
    openModal("confirmation-dialog", {
      title: "Delete inventory item",
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteInventoryItem(item.id).unwrap();
          toast.success("Inventory item deleted successfully");
        } catch (error: unknown) {
          const message =
            getRTKQueryErrorMessage(error) ||
            "Failed to delete inventory item. Please try again.";
          toast.error(message);
        } finally {
          closeModal("confirmation-dialog");
        }
      },
      onCancel: () => closeModal("confirmation-dialog"),
    });
  };

  const handleViewStockEntries = (item: InventoryItem) => {
    navigate(`/inventory/stock?itemId=${encodeURIComponent(item.id)}`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Inventory Items
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            Manage the hospital inventory
          </p>
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
            onAddItem={() => setShowAddForm(true)}
          />
        )}

        <AddInventoryModal open={showAddForm} onOpenChange={setShowAddForm} />

        {selectedItem && (
          <EditInventoryModal
            item={selectedItem}
            open={showEditModal}
            onOpenChange={(open) => {
              setShowEditModal(open);
              if (!open) {
                setSelectedItem(null);
              }
            }}
          />
        )}

        {selectedItem && (
          <UpdateStockModal
            inventoryItem={selectedItem}
            open={showStockModal}
            onOpenChange={(open) => {
              setShowStockModal(open);
              if (!open) {
                setSelectedItem(null);
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
}
