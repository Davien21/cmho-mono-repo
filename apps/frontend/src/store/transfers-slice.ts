import {
  IAPIResponse,
  IGetTransfersParams,
  ITransferResponse,
  ITransferDetails,
} from "@/types";

import { baseApi } from "@/store/api-slice";
import { TagTypes } from "./tags";
import { buildQueryString } from "@/lib/utils";

export const transferApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransfers: builder.query<
      IAPIResponse<ITransferResponse>,
      IGetTransfersParams
    >({
      query: (params) => {
        const queryString = buildQueryString(params);

        return {
          url: `/transfers?${queryString}`,
          method: "GET",
        };
      },
      providesTags: [TagTypes.TRANSFER],
    }),
    getTransferDetails: builder.query<IAPIResponse<ITransferDetails>, string>({
      query: (transferId) => ({
        url: `/transfers/${transferId}`,
        method: "GET",
      }),
      providesTags: [TagTypes.TRANSFER],
    }),
    singlePayment: builder.mutation<
      IAPIResponse<unknown>,
      { employeeIds: string[] }
    >({
      query: (body) => {
        return {
          url: "/transfers/single",
          method: "POST",
          body,
        };
      },
      invalidatesTags: [TagTypes.TRANSFER],
    }),
    multiplePayments: builder.mutation<
      IAPIResponse<unknown>,
      { employeeIds: string[] }
    >({
      query: (body) => ({
        url: "/transfers/multiple",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        TagTypes.EMPLOYEE,
        TagTypes.DASHBOARD_STATS,
        TagTypes.TRANSFER,
      ],
    }),
  }),
});

export const {
  useGetTransfersQuery,
  useGetTransferDetailsQuery,
  useSinglePaymentMutation,
  useMultiplePaymentsMutation,
} = transferApi;
