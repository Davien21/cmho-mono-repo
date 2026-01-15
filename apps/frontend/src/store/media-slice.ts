import { baseApi } from "@/store/api-slice";
import { IAPIResponse } from "@/types";
import { TagTypes } from "@/store/tags";

export enum MediaCategory {
  INVENTORY = "inventory",
  BALANCE_SHEET = "balance_sheet",
  STOCK_UPDATE = "stock_update",
}

export interface IMediaDto {
  _id: string;
  url: string;
  size: number;
  type: string;
  public_id: string;
  filename: string;
  category: MediaCategory;
  duration?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITranscriptionResult {
  name: string;
  quantity_details: string;
}

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMedia: builder.query<IAPIResponse<IMediaDto[]>, { category?: MediaCategory } | void>({
      query: (params) => ({
        url: "/media",
        method: "GET",
        params: params || {},
      }),
      providesTags: [TagTypes.MEDIA],
    }),
    uploadMedia: builder.mutation<IAPIResponse<IMediaDto>, { formData: FormData; category?: MediaCategory }>({
      query: ({ formData, category }) => {
        if (category) {
          formData.append("category", category);
        }
        return {
          url: "/media",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [TagTypes.MEDIA],
    }),
    deleteMedia: builder.mutation<IAPIResponse<void>, { public_id: string }>({
      query: (body) => ({
        url: "/media/delete",
        method: "POST",
        body,
      }),
      invalidatesTags: [TagTypes.MEDIA],
    }),
    transcribeImage: builder.mutation<
      IAPIResponse<ITranscriptionResult>,
      { imageUrl: string }
    >({
      query: (body) => ({
        url: "/media/transcribe",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetMediaQuery,
  useUploadMediaMutation,
  useDeleteMediaMutation,
  useTranscribeImageMutation,
} = mediaApi;
