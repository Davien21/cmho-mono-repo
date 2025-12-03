import { IAPIResponse, IAdmin } from "@/types";

import { baseApi } from "@/store/api-slice";
import { TagTypes } from "@/store/tags";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      IAPIResponse<void>,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.AUTH],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags([TagTypes.AUTH]));
        } catch (error) {
          // Handle login error if needed
        }
      },
    }),
    verify: builder.query<IAPIResponse<void>, void>({
      query: () => ({
        url: "/auth/verify",
        method: "GET",
      }),
      providesTags: [TagTypes.AUTH],
    }),
    getCurrentUser: builder.query<IAPIResponse<IAdmin>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: [TagTypes.AUTH],
    }),
    logout: builder.mutation<IAPIResponse<void>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: [TagTypes.AUTH],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
        } catch (error) {
          // Handle logout error if needed
        }
      },
    }),
  }),
});

export const {
  useLogoutMutation,
  useLoginMutation,
  useVerifyQuery,
  useGetCurrentUserQuery,
} = authApi;
