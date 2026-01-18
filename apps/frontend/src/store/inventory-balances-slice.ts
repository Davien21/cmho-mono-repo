import { baseApi } from "@/store/api-slice";
import { IAPIResponse, IQueryMeta } from "@/types";
import { TagTypes } from "@/store/tags";

export enum AIInventoryBalanceStatus {
  PENDING = "pending",
  SYNCED = "synced",
}

export interface IAIInventoryBalanceItemDto {
  _id: string;
  media: {
    id: string;
    url: string;
  };
  name: string;
  quantity_details: string;
  inventory_id?: string;
  status: AIInventoryBalanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IInventoryBalancesResponse {
  items: IAIInventoryBalanceItemDto[];
  meta: IQueryMeta;
}

export const inventoryBalancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStagedItems: builder.query<
      IAPIResponse<IInventoryBalancesResponse>,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/inventory-balances/staged",
        method: "GET",
        params: params || {},
      }),
      providesTags: [TagTypes.INVENTORY_BALANCES],
    }),
    getStagedItemsByMediaId: builder.query<
      IAPIResponse<IInventoryBalancesResponse>,
      string
    >({
      query: (mediaId) => ({
        url: `/inventory-balances/staged/media/${mediaId}`,
        method: "GET",
      }),
      providesTags: (result, error, mediaId) => [
        { type: TagTypes.INVENTORY_BALANCES, id: mediaId },
      ],
    }),
    processInventoryBalance: builder.mutation<
      IAPIResponse<{ media: { id: string; url: string }; items: IAIInventoryBalanceItemDto[] }>,
      { media_id: string; imageUrl: string }
    >({
      query: (body) => ({
        url: "/inventory-balances/process",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.INVENTORY_BALANCES, TagTypes.MEDIA],
    }),
    deleteStagedItem: builder.mutation<IAPIResponse<void>, string>({
      query: (id) => ({
        url: `/inventory-balances/staged/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.INVENTORY_BALANCES],
    }),
  }),
});

export const {
  useGetStagedItemsQuery,
  useGetStagedItemsByMediaIdQuery,
  useProcessInventoryBalanceMutation,
  useDeleteStagedItemMutation,
} = inventoryBalancesApi;

