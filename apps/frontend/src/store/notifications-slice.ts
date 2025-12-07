import { baseApi } from "@/store/api-slice";
import { IAPIResponse } from "@/types";
import { TagTypes } from "@/store/tags";

export interface InventoryNotificationMetadata {
  inventoryId: string;
  currentStock: number;
  lowStockValue: number;
  [key: string]: any;
}

export interface INotificationDto {
  _id: string;
  type: "out_of_stock" | "low_stock";
  module: "inventory" | "salary" | "admin";
  status: "active" | "resolved";
  title: string;
  description: string;
  priority: "HIGH" | "MED" | "LOW";
  metadata: InventoryNotificationMetadata | { [key: string]: any };
  createdAt: string;
  updatedAt: string;
}

export interface IGetNotificationsQuery {
  status?: "active" | "resolved";
  module?: string;
  type?: string;
  inventoryId?: string;
  title?: string; // Exact match filter for title
  search?: string; // Regex search for description
  limit?: number;
  page?: number;
  sort?: "asc" | "desc";
}

export interface INotificationsResponse {
  data: INotificationDto[];
  total: number;
  page: number;
  limit: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      IAPIResponse<INotificationsResponse>,
      IGetNotificationsQuery | void
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: params
          ? {
              ...params,
            }
          : undefined,
      }),
      providesTags: [TagTypes.NOTIFICATIONS],
      // Refetch when component mounts or args change to ensure fresh data
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const { useGetNotificationsQuery } = notificationsApi;

