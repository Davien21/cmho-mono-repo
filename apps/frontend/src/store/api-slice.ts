// src/services/baseApi.ts
import { env } from "@/env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TagTypes } from "@/store/tags";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: env.VITE_API_BASE_URL,
    credentials: "include",
  }),
  endpoints: () => ({}), // empty, will be extended
  tagTypes: [
    TagTypes.EMPLOYEE,
    TagTypes.DASHBOARD_STATS,
    TagTypes.TRANSFER,
    TagTypes.AUTH,
    TagTypes.INVENTORY_UNITS,
    TagTypes.INVENTORY_CATEGORIES,
  ],
});
