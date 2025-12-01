import { baseApi } from "@/store/api-slice";
import { IAPIResponse } from "@/types";
import { TagTypes } from "@/store/tags";

export interface IInventoryUnitDefinitionDto {
  _id: string;
  name: string;
  plural: string;
}

export interface IInventoryCategoryDto {
  _id: string;
  name: string;
  unitPresetIds?: string[];
}

export interface ICreateInventoryUnitRequest {
  name: string;
  plural: string;
}

export interface IUpdateInventoryUnitRequest extends ICreateInventoryUnitRequest {
  id: string;
}

export interface ICreateInventoryCategoryRequest {
  name: string;
  unitPresetIds?: string[];
}

export interface IUpdateInventoryCategoryRequest
  extends ICreateInventoryCategoryRequest {
  id: string;
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
      invalidatesTags: [TagTypes.INVENTORY_UNITS, TagTypes.INVENTORY_CATEGORIES],
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
      invalidatesTags: [TagTypes.INVENTORY_UNITS, TagTypes.INVENTORY_CATEGORIES],
    }),
    deleteInventoryUnit: builder.mutation<IAPIResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.INVENTORY_UNITS, TagTypes.INVENTORY_CATEGORIES],
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
  }),
});

export const {
  useGetInventoryUnitsQuery,
  useCreateInventoryUnitMutation,
  useUpdateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
  useGetInventoryCategoriesQuery,
  useCreateInventoryCategoryMutation,
  useUpdateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
} = inventoryApi;


