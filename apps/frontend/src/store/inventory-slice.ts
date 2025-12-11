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
  quantity?: number;
}

export interface IInventoryItemImageDto {
  url: string;
  mediaId: string;
}

export interface IInventoryItemCategoryDto {
  _id: string;
  name: string;
}

export interface IInventoryItemDto {
  _id: string;
  name: string;
  category: IInventoryItemCategoryDto;
  units: IInventoryItemUnitDto[];
  lowStockValue: number;
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

export interface IInventoryItemSnapshotDto {
  id: string;
  name: string;
}

export interface IPerformerSnapshotDto {
  id: string;
  name: string;
}

export interface IPriceSnapshotDto {
  costPrice: number;
  sellingPrice: number;
}

export interface IStockMovementDto {
  _id: string;
  inventoryItem: IInventoryItemSnapshotDto;
  operationType: StockOperationType;
  supplier: IStockSupplierSnapshotDto | null;
  prices: IPriceSnapshotDto | null;
  expiryDate: string;
  quantityInBaseUnits: number;
  balance: number;
  performer: IPerformerSnapshotDto;
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
  category: string; // Send category ID (ObjectId as string)
  units: IInventoryItemUnitDto[];
  lowStockValue: number;
  status: InventoryItemStatus;
  currentStockInBaseUnits?: number;
  image?: IInventoryItemImageDto;
  canBeSold?: boolean;
}

export interface IUpdateInventoryItemRequest
  extends Partial<ICreateInventoryItemRequest> {
  id: string;
}

export interface ICreateStockMovementRequest {
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

export interface IAddStockRequest {
  inventoryItemId: string;
  supplier: {
    supplierId: string;
    name: string;
  } | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string | Date;
  quantityInBaseUnits: number;
}

export interface IReduceStockRequest {
  inventoryItemId: string;
  supplier: {
    supplierId: string;
    name: string;
  } | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  expiryDate?: string | Date | null;
  quantityInBaseUnits: number;
}

export interface IGetStockMovementQuery {
  inventoryItemId?: string;
  operationType?: StockOperationType;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
  search?: string;
}

export interface IStockMovementResponse {
  data: IStockMovementDto[];
  total: number;
  page: number;
  limit: number;
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
      IAPIResponse<{
        data: IInventoryItemDto[];
        total: number;
        page: number;
        limit: number;
      }>,
      {
        stockFilter?: "outOfStock" | "lowStock" | "inStock";
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params = {}) => ({
        url: "/inventory/items",
        method: "GET",
        params: {
          sort: "desc",
          page: params.page || 1,
          limit: params.limit || 25,
          ...(params.stockFilter && { stockFilter: params.stockFilter }),
          ...(params.search && { search: params.search }),
          ...(params.category && { category: params.category }),
        },
      }),
      providesTags: [TagTypes.INVENTORY_ITEMS],
    }),
    getInventoryDashboardStats: builder.query<
      IAPIResponse<{
        totalItems: number;
        inStock: number;
        lowStock: number;
        outOfStock: number;
      }>,
      void
    >({
      query: () => ({
        url: "/inventory/dashboard/stats",
        method: "GET",
      }),
      providesTags: [TagTypes.INVENTORY_ITEMS],
    }),
    getInventoryItemsPages: builder.infiniteQuery<
      IAPIResponse<{
        data: IInventoryItemDto[];
        total: number;
        page: number;
        limit: number;
      }>,
      {
        stockFilter?: "outOfStock" | "lowStock" | "inStock";
        search?: string;
        category?: string;
      },
      number
    >({
      query: (arg) => {
        const { pageParam, queryArg } = arg as {
          pageParam: number;
          queryArg: {
            stockFilter?: "outOfStock" | "lowStock" | "inStock";
            search?: string;
            category?: string;
          };
        };
        return {
          url: "/inventory/items",
          method: "GET",
          params: {
            sort: "desc",
            page: pageParam,
            limit: 20,
            ...(queryArg?.stockFilter && { stockFilter: queryArg.stockFilter }),
            ...(queryArg?.search && { search: queryArg.search }),
            ...(queryArg?.category && { category: queryArg.category }),
          },
        };
      },
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
          const total = lastPage.data.total;
          const limit = lastPage.data.limit;
          const totalPages = Math.ceil(total / limit);
          const currentPage = allPages.length;
          return currentPage < totalPages ? currentPage + 1 : undefined;
        },
      },
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

    getStockMovement: builder.query<
      IAPIResponse<IStockMovementResponse>,
      IGetStockMovementQuery | void
    >({
      query: (params) => ({
        url: "/inventory/stock-movement",
        method: "GET",
        params: params
          ? {
              ...params,
            }
          : undefined,
      }),
      providesTags: [TagTypes.STOCK_MOVEMENTS],
    }),
    getStockMovementPages: builder.infiniteQuery<
      IAPIResponse<IStockMovementResponse>,
      Omit<IGetStockMovementQuery, "page" | "limit">,
      number
    >({
      query: (arg) => {
        const { pageParam, queryArg } = arg as {
          pageParam: number;
          queryArg: Omit<IGetStockMovementQuery, "page" | "limit">;
        };
        return {
          url: "/inventory/stock-movement",
          method: "GET",
          params: {
            ...queryArg,
            page: pageParam,
            limit: 20,
            sort: queryArg?.sort || "desc",
          },
        };
      },
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
          const total = lastPage.data.total;
          const limit = lastPage.data.limit;
          const totalPages = Math.ceil(total / limit);
          const currentPage = allPages.length;
          return currentPage < totalPages ? currentPage + 1 : undefined;
        },
      },
      providesTags: [TagTypes.STOCK_MOVEMENTS],
    }),
    createStockMovement: builder.mutation<
      IAPIResponse<IStockMovementDto>,
      ICreateStockMovementRequest
    >({
      query: (body) => ({
        url: "/inventory/stock-movement",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.STOCK_MOVEMENTS,
        TagTypes.INVENTORY_ITEMS,
        TagTypes.ACTIVITY_RECORDS,
      ],
    }),
    addStock: builder.mutation<
      IAPIResponse<IStockMovementDto>,
      IAddStockRequest
    >({
      query: (body) => ({
        url: "/inventory/stock-movement/add",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.STOCK_MOVEMENTS,
        TagTypes.INVENTORY_ITEMS,
        TagTypes.ACTIVITY_RECORDS,
      ],
    }),
    reduceStock: builder.mutation<
      IAPIResponse<IStockMovementDto>,
      IReduceStockRequest
    >({
      query: (body) => ({
        url: "/inventory/stock-movement/reduce",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.STOCK_MOVEMENTS,
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
  useGetInventoryDashboardStatsQuery,
  useGetInventoryItemsPagesInfiniteQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetStockMovementQuery,
  useGetStockMovementPagesInfiniteQuery,
  useCreateStockMovementMutation,
  useAddStockMutation,
  useReduceStockMutation,
} = inventoryApi;
