import { IAPIResponse } from '@/types';

import { baseApi } from '@/store/api-slice';
import { IBank } from '@/types';
export const bankApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBanks: builder.query<IAPIResponse<IBank[]>, void>({
      query: () => ({
        url: '/banks/list',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetBanksQuery } = bankApi;
