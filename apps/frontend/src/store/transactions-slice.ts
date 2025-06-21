import { IAPIResponse, ITransaction, IQueryMeta, ESortOrder } from "@/types";

import { baseApi } from "@/store/api-slice";
import { TagTypes } from "./tags";
import { buildQueryString } from "@/lib/utils";

export interface IGetTransactionsParams {
  page?: number;
  limit?: number;
  sort?: ESortOrder;
  search?: string;
}

export interface ITransactionsResponse {
  transactions: ITransaction[];
  meta: IQueryMeta;
}

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<
      IAPIResponse<ITransactionsResponse>,
      IGetTransactionsParams
    >({
      query: (params) => {
        const queryString = buildQueryString(params);

        return {
          url: `/transactions?${queryString}`,
          method: "GET",
        };
      },
      providesTags: [TagTypes.TRANSFER], // Using TRANSFER tag as transactions are related to transfers
    }),
  }),
});

export const { useGetTransactionsQuery } = transactionApi;
