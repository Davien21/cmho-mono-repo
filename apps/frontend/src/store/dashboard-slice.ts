import { IAPIResponse } from "@/types";

import { IDashboardStats } from "@/types";
import { baseApi } from "@/store/api-slice";
import { TagTypes } from "@/store/tags";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<IAPIResponse<IDashboardStats>, void>({
      query: () => ({
        url: "/dashboard",
        method: "GET",
      }),
      providesTags: [TagTypes.DASHBOARD_STATS],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
