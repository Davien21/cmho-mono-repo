import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InventoryList } from "@/components/InventoryList";
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

// Key for localStorage
const PAGINATION_STORAGE_KEY = "inventoryPaginationPrefs";

// Load pagination preferences from localStorage
const loadPaginationPrefs = (): { pageSize: number } => {
  try {
    const stored = localStorage.getItem(PAGINATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { pageSize: parsed.pageSize || 25 };
    }
  } catch (error) {
    console.error("Failed to load pagination preferences:", error);
  }
  return { pageSize: 25 };
};

// Save pagination preferences to localStorage
const savePaginationPrefs = (prefs: { pageSize: number }) => {
  try {
    localStorage.setItem(PAGINATION_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("Failed to save pagination preferences:", error);
  }
};

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

  // Pagination state with localStorage persistence
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => loadPaginationPrefs().pageSize);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, debouncedSearch]);

  const queryParams = useMemo(() => {
    const params: {
      stockFilter?: "outOfStock" | "lowStock" | "inStock";
      search?: string;
      category?: string;
      page: number;
      limit: number;
    } = {
      page: currentPage,
      limit: pageSize,
    };
    if (filter) {
      params.stockFilter = filter;
    }
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    return params;
  }, [filter, debouncedSearch, currentPage, pageSize]);

  const { data, isLoading, isFetching } = useGetInventoryItemsQuery(queryParams);

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

  // Transform DTOs to InventoryItems
  const items: InventoryItem[] = useMemo(() => {
    if (!data?.data?.data) return [];
    const dtos: IInventoryItemDto[] = data.data.data;
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
      earliestExpiryDate: dto.earliestExpiryDate ?? null,
      image: dto.image,
    }));
  }, [data]);

  // Server-side pagination metadata
  const totalItems = data?.data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    savePaginationPrefs({ pageSize: newPageSize });
  };

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalMode, setImageModalMode] = useState<"add" | "edit">("add");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const navigate = useNavigate();

  const handleAddStock = (item: InventoryItem) => {
    openModal("add-stock", item);
  };

  const handleReduceStock = (item: InventoryItem) => {
    openModal("reduce-stock", item);
  };

  const handleEdit = (item: InventoryItem) => {
    openModal("edit-inventory", item);
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
    navigate(`/inventory/stock-movement?itemId=${encodeURIComponent(item.id)}`);
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
            onAddItem={() => openModal("add-inventory", undefined)}
            onEditImage={handleEditImage}
            onPreviewImage={handlePreviewImage}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
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
