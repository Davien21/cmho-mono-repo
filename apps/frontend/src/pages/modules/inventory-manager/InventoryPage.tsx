import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { InventoryList } from "@/components/InventoryList";
import { AddStockModal } from "@/components/modals/AddStockModal";
import { ReduceStockModal } from "@/components/modals/ReduceStockModal";
import { EditInventoryModal } from "@/components/modals/EditInventoryModal";
import { AddInventoryImageModal } from "@/components/modals/AddInventoryImageModal";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
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
import { useDebounce } from "@/hooks/use-debounce";

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") as
    | "outOfStock"
    | "lowStock"
    | "inStock"
    | null;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const isSearchingRef = useRef(false);

  const queryParams = useMemo(() => {
    const params: {
      stockFilter?: "outOfStock" | "lowStock" | "inStock";
      search?: string;
    } = {};
    if (filter) {
      params.stockFilter = filter;
    }
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    // Always return an object to ensure consistent caching
    return params;
  }, [filter, debouncedSearch]);

  const { data, isLoading, isFetching } =
    useGetInventoryItemsQuery(queryParams);

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
      stocks: [],
      currentStockInBaseUnits: dto.currentStockInBaseUnits,
      earliestExpiryDate: dto.earliestExpiryDate ?? null,
      image: dto.image,
    }));
  }, [data]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showReduceStockModal, setShowReduceStockModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalMode, setImageModalMode] = useState<"add" | "edit">("add");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const navigate = useNavigate();

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowAddStockModal(true);
  };

  const handleReduceStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowReduceStockModal(true);
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
          const message = getRTKQueryErrorMessage(
            error,
            "Failed to delete inventory item. Please try again."
          );
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

  const handleEditImage = (item: InventoryItem) => {
    setSelectedItem(item);
    setImageModalMode(item.image?.url ? "edit" : "add");
    setShowImageModal(true);
  };

  const handlePreviewImage = (item: InventoryItem) => {
    if (item.image?.url) {
      setPreviewImage({
        url: item.image.url,
        name: item.name,
      });
    }
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
            search={search}
            onSearchChange={setSearch}
            isFetching={isFetching && isSearchingRef.current}
            onAddStock={handleAddStock}
            onReduceStock={handleReduceStock}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewStockEntries={handleViewStockEntries}
            onAddItem={() => setShowAddForm(true)}
            onEditImage={handleEditImage}
            onPreviewImage={handlePreviewImage}
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
          <AddStockModal
            inventoryItem={selectedItem}
            open={showAddStockModal}
            onOpenChange={(open) => {
              setShowAddStockModal(open);
              if (!open) {
                setSelectedItem(null);
              }
            }}
          />
        )}

        {selectedItem && (
          <ReduceStockModal
            inventoryItem={selectedItem}
            open={showReduceStockModal}
            onOpenChange={(open) => {
              setShowReduceStockModal(open);
              if (!open) {
                setSelectedItem(null);
              }
            }}
          />
        )}

        {selectedItem && (
          <AddInventoryImageModal
            item={selectedItem}
            open={showImageModal}
            onOpenChange={(open) => {
              setShowImageModal(open);
              if (!open) {
                setSelectedItem(null);
              }
            }}
            mode={imageModalMode}
          />
        )}

        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      </div>
    </Layout>
  );
}
