import { baseApi } from "@/store/api-slice";
import { IAPIResponse } from "@/types";
import { TagTypes } from "@/store/tags";

export interface IActivityRecordDto {
  _id: string;
  type: string;
  module: string;
  entities: Array<{
    id: string;
    name: string;
  }>;
  admin: {
    id: string;
    name: string;
  };
  description: string;
  metadata: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IGetActivitiesQuery {
  module?: string;
  adminId?: string;
  entityId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // Regex search for description OR admin name
  limit?: number;
  page?: number;
  sort?: "asc" | "desc";
}

export interface IActivitiesResponse {
  data: IActivityRecordDto[];
  total: number;
  page: number;
  limit: number;
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query<
      IAPIResponse<IActivitiesResponse>,
      IGetActivitiesQuery | void
    >({
      query: (params) => ({
        url: "/activities",
        method: "GET",
        params: params
          ? {
              ...params,
            }
          : undefined,
      }),
      providesTags: [TagTypes.ACTIVITY_RECORDS],
      // Refetch when component mounts or args change to ensure fresh data
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const { useGetActivitiesQuery } = activityApi;

