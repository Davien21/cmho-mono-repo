import { baseApi } from "@/store/api-slice";
import { IAPIResponse } from "@/types";
import { TagTypes } from "@/store/tags";

export interface IInventoryUnitDefinitionDto {
  _id: string;
  name: string;
  plural: string;
  order?: number;
}

export interface IInventoryCategoryUnitPresetDto {
  _id: string;
  name: string;
  plural: string;
}

export interface IInventoryCategoryDto {
  _id: string;
  name: string;
  /**
   * IDs of unit presets associated with this category.
   * Always present as string ids in the API response.
   */
  unitPresetIds?: string[];
  /**
   * Populated unit preset documents for this category.
   * Available when the backend populates `unitPresetIds`.
   */
  unitPresets?: IInventoryCategoryUnitPresetDto[];
  canBeSold?: boolean;
  order?: number;
}

export type SupplierStatus = "active" | "disabled" | "deleted";

export interface ISupplierDto {
  _id: string;
  name: string;
  contact?: {
    phone?: string;
    address?: string;
  };
  status: SupplierStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryItemStatus = "active" | "disabled" | "deleted";

export interface IInventoryItemUnitDto {
  id: string;
  name: string;
  plural: string;
  presetId?: string;
  quantity?: number;
}

export interface IInventoryItemImageDto {
  url: string;
  mediaId: string;
}

export interface IInventoryItemDto {
  _id: string;
  name: string;
  category: string;
  units: IInventoryItemUnitDto[];
  lowStockValue?: number;
  status: InventoryItemStatus;
  currentStockInBaseUnits?: number;
  earliestExpiryDate?: string;
  image?: IInventoryItemImageDto;
  canBeSold?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type StockOperationType = "add" | "reduce";

export interface IStockSupplierSnapshotDto {
  supplierId: string;
  name: string;
}

export interface IStockEntryDto {
  _id: string;
  inventoryItemId: string;
  operationType: StockOperationType;
  supplier: IStockSupplierSnapshotDto | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  quantityInBaseUnits: number;
  createdBy: string;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateInventoryUnitRequest {
  name: string;
  plural: string;
}

export interface IUpdateInventoryUnitRequest
  extends ICreateInventoryUnitRequest {
  id: string;
  order?: number;
}

export interface IReorderInventoryUnitsRequest {
  unitOrders: Array<{ id: string; order: number }>;
}

export interface ICreateInventoryCategoryRequest {
  name: string;
  unitPresetIds?: string[];
  canBeSold?: boolean;
}

export interface IUpdateInventoryCategoryRequest
  extends ICreateInventoryCategoryRequest {
  id: string;
}

export interface IReorderInventoryCategoriesRequest {
  categoryOrders: Array<{ id: string; order: number }>;
}

export interface ICreateSupplierRequest {
  name: string;
  contact?: {
    phone?: string;
    address?: string;
  };
  status?: SupplierStatus;
}

export interface IUpdateSupplierRequest
  extends Partial<ICreateSupplierRequest> {
  id: string;
}

export interface ICreateInventoryItemRequest {
  name: string;
  category: string;
  units: IInventoryItemUnitDto[];
  lowStockValue?: number;
  status: InventoryItemStatus;
  currentStockInBaseUnits?: number;
  image?: IInventoryItemImageDto;
  canBeSold?: boolean;
}

export interface IUpdateInventoryItemRequest
  extends Partial<ICreateInventoryItemRequest> {
  id: string;
}

export interface ICreateStockEntryRequest {
  inventoryItemId: string;
  operationType: StockOperationType;
  supplier: {
    supplierId: string;
    name: string;
  } | null;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string | Date;
  quantityInBaseUnits: number;
}

export interface IGetStockEntriesQuery {
  inventoryItemId?: string;
  operationType?: StockOperationType;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryUnits: builder.query<
      IAPIResponse<IInventoryUnitDefinitionDto[]>,
      void
    >({
      query: () => ({
        url: "/inventory/units",
        method: "GET",
      }),
      providesTags: [TagTypes.INVENTORY_UNITS],
    }),
    createInventoryUnit: builder.mutation<
      IAPIResponse<IInventoryUnitDefinitionDto>,
      ICreateInventoryUnitRequest
    >({
      query: (body) => ({
        url: "/inventory/units",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.INVENTORY_UNITS,
        TagTypes.INVENTORY_CATEGORIES,
      ],
    }),
    updateInventoryUnit: builder.mutation<
      IAPIResponse<IInventoryUnitDefinitionDto | null>,
      IUpdateInventoryUnitRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/inventory/units/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        TagTypes.INVENTORY_UNITS,
        TagTypes.INVENTORY_CATEGORIES,
      ],
    }),
    deleteInventoryUnit: builder.mutation<IAPIResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        TagTypes.INVENTORY_UNITS,
        TagTypes.INVENTORY_CATEGORIES,
      ],
    }),
    reorderInventoryUnits: builder.mutation<
      IAPIResponse<void>,
      IReorderInventoryUnitsRequest
    >({
      query: (body) => ({
        url: "/inventory/units/reorder",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.INVENTORY_UNITS,
        TagTypes.INVENTORY_CATEGORIES,
      ],
    }),

    getInventoryCategories: builder.query<
      IAPIResponse<IInventoryCategoryDto[]>,
      void
    >({
      query: () => ({
        url: "/inventory/categories",
        method: "GET",
      }),
      providesTags: [TagTypes.INVENTORY_CATEGORIES],
    }),
    createInventoryCategory: builder.mutation<
      IAPIResponse<IInventoryCategoryDto>,
      ICreateInventoryCategoryRequest
    >({
      query: (body) => ({
        url: "/inventory/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.INVENTORY_CATEGORIES],
    }),
    updateInventoryCategory: builder.mutation<
      IAPIResponse<IInventoryCategoryDto | null>,
      IUpdateInventoryCategoryRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/inventory/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [TagTypes.INVENTORY_CATEGORIES],
    }),
    deleteInventoryCategory: builder.mutation<IAPIResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.INVENTORY_CATEGORIES],
    }),
    reorderInventoryCategories: builder.mutation<
      IAPIResponse<void>,
      IReorderInventoryCategoriesRequest
    >({
      query: (body) => ({
        url: "/inventory/categories/reorder",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.INVENTORY_CATEGORIES],
    }),

    getSuppliers: builder.query<IAPIResponse<ISupplierDto[]>, void>({
      query: () => ({
        url: "/inventory/suppliers",
        method: "GET",
      }),
      providesTags: [TagTypes.SUPPLIERS],
    }),
    createSupplier: builder.mutation<
      IAPIResponse<ISupplierDto>,
      ICreateSupplierRequest
    >({
      query: (body) => ({
        url: "/inventory/suppliers",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.SUPPLIERS],
    }),
    updateSupplier: builder.mutation<
      IAPIResponse<ISupplierDto | null>,
      IUpdateSupplierRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/inventory/suppliers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [TagTypes.SUPPLIERS],
    }),
    deleteSupplier: builder.mutation<IAPIResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.SUPPLIERS],
    }),

    getInventoryItems: builder.query<
      IAPIResponse<IInventoryItemDto[]>,
      { stockFilter?: "outOfStock" | "lowStock" | "inStock" } | void
    >({
      query: (params) => ({
        url: "/inventory/items",
        method: "GET",
        params: {
          sort: "desc",
          limit: 100,
          ...(params?.stockFilter && { stockFilter: params.stockFilter }),
        },
      }),
      providesTags: [TagTypes.INVENTORY_ITEMS],
    }),
    createInventoryItem: builder.mutation<
      IAPIResponse<IInventoryItemDto>,
      ICreateInventoryItemRequest
    >({
      query: (body) => ({
        url: "/inventory/items",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.INVENTORY_ITEMS],
    }),
    updateInventoryItem: builder.mutation<
      IAPIResponse<IInventoryItemDto | null>,
      IUpdateInventoryItemRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/inventory/items/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [TagTypes.INVENTORY_ITEMS],
    }),
    deleteInventoryItem: builder.mutation<IAPIResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.INVENTORY_ITEMS],
    }),

    getStockEntries: builder.query<
      IAPIResponse<IStockEntryDto[]>,
      IGetStockEntriesQuery | void
    >({
      query: (params) => ({
        url: "/inventory/stock-entries",
        method: "GET",
        params: params
          ? {
              ...params,
            }
          : undefined,
      }),
      providesTags: [TagTypes.STOCK_ENTRIES],
    }),
    createStockEntry: builder.mutation<
      IAPIResponse<IStockEntryDto>,
      ICreateStockEntryRequest
    >({
      query: (body) => ({
        url: "/inventory/stock-entries",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.STOCK_ENTRIES,
        TagTypes.INVENTORY_ITEMS,
        TagTypes.ACTIVITY_RECORDS,
      ],
    }),
  }),
});

export const {
  useGetInventoryUnitsQuery,
  useCreateInventoryUnitMutation,
  useUpdateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
  useReorderInventoryUnitsMutation,
  useGetInventoryCategoriesQuery,
  useCreateInventoryCategoryMutation,
  useUpdateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
  useReorderInventoryCategoriesMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetStockEntriesQuery,
  useCreateStockEntryMutation,
} = inventoryApi;
