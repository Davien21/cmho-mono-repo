import { IAPIResponse } from '@/types';

import { baseApi } from '@/store/api-slice';
import {
  IEmployee,
  IAddEmployeeRequest,
  IGetEmployeesParams,
  IUpdateEmployeeRequest,
} from '@/types';
import { buildQueryString } from '@/lib/utils';
import { TagTypes } from '@/store/tags';

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addEmployee: builder.mutation<IAPIResponse<null>, Partial<IAddEmployeeRequest>>({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: [TagTypes.EMPLOYEE, TagTypes.DASHBOARD_STATS],
    }),
    updateEmployee: builder.mutation<IAPIResponse<null>, IUpdateEmployeeRequest>({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [TagTypes.EMPLOYEE, TagTypes.DASHBOARD_STATS],
    }),
    getEmployees: builder.query<IAPIResponse<IEmployee[]>, IGetEmployeesParams>({
      query: (params) => {
        const queryString = buildQueryString(params);

        return {
          url: `/employees?${queryString}`,
          method: 'GET',
        };
      },
      providesTags: [TagTypes.EMPLOYEE],
    }),
  }),
});

export const { useAddEmployeeMutation, useUpdateEmployeeMutation, useGetEmployeesQuery } =
  employeeApi;
