import { IAPIResponse } from "@/types";

import { baseApi } from "@/store/api-slice";
import { IAdmin, IGetEmployeesParams } from "@/types";
import { buildQueryString } from "@/lib/utils";
import { TagTypes } from "@/store/tags";

export interface IAddAdminRequest {
  name: string;
  email: string;
  password: string;
  roles?: string[];
  isSuperAdmin?: boolean;
}

export interface IUpdateAdminRequest {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  roles?: string[];
  isSuperAdmin?: boolean;
  status?: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addAdmin: builder.mutation<IAPIResponse<IAdmin>, IAddAdminRequest>({
      query: (body) => ({
        url: "/admins",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.ADMIN],
    }),
    updateAdmin: builder.mutation<IAPIResponse<null>, IUpdateAdminRequest>({
      query: ({ id, ...body }) => ({
        url: `/admins/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [TagTypes.ADMIN],
    }),
    disableAdmin: builder.mutation<IAPIResponse<null>, string>({
      query: (id) => ({
        url: `/admins/${id}/disable`,
        method: "PATCH",
      }),
      invalidatesTags: [TagTypes.ADMIN],
    }),
    getAdmins: builder.query<IAPIResponse<IAdmin[]>, IGetEmployeesParams>({
      query: (params) => {
        const queryString = buildQueryString(params);

        return {
          url: `/admins?${queryString}`,
          method: "GET",
        };
      },
      providesTags: [TagTypes.ADMIN],
    }),
  }),
});

export const {
  useAddAdminMutation,
  useUpdateAdminMutation,
  useDisableAdminMutation,
  useGetAdminsQuery,
} = adminApi;


