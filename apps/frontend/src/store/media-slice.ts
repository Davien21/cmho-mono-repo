import { baseApi } from "@/store/api-slice";
import { IAPIResponse } from "@/types";
import { TagTypes } from "@/store/tags";

export interface IMediaDto {
  _id: string;
  url: string;
  size: number;
  type: string;
  public_id: string;
  filename: string;
  duration?: any;
  createdAt?: string;
  updatedAt?: string;
}

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMedia: builder.query<IAPIResponse<IMediaDto[]>, void>({
      query: () => ({
        url: "/media",
        method: "GET",
      }),
      providesTags: [TagTypes.MEDIA],
    }),
    uploadMedia: builder.mutation<IAPIResponse<IMediaDto>, FormData>({
      query: (formData) => ({
        url: "/media",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [TagTypes.MEDIA],
    }),
    deleteMedia: builder.mutation<IAPIResponse<void>, { _id: string; public_id: string }>({
      query: (body) => ({
        url: "/media/delete",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.MEDIA],
    }),
  }),
});

export const {
  useGetMediaQuery,
  useUploadMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;

