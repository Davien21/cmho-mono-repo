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
  performer: {
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
  performerId?: string;
  entityId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // Regex search for description OR performer name
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
    }),
    getActivitiesPages: builder.infiniteQuery<
      IAPIResponse<IActivitiesResponse>,
      Omit<IGetActivitiesQuery, "page" | "limit">,
      number
    >({
      query: ({ pageParam, ...queryArg }) => ({
        url: "/activities",
        method: "GET",
        params: {
          ...queryArg,
          page: pageParam,
          limit: 20,
        },
      }),
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
      providesTags: [TagTypes.ACTIVITY_RECORDS],
    }),
  }),
});

export const { useGetActivitiesQuery, useGetActivitiesPagesInfiniteQuery } =
  activityApi;
