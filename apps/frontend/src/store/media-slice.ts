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
  name?: string; // User-friendly name or cmho-temp_[filename]
  category: MediaCategory;
  duration?: any;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMediaResponse {
  items: IMediaDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ITranscriptionResult {
  name: string;
  quantity_details: string;
}

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Paginated list with merge logic (for infinite scroll)
    getMedia: builder.query<
      IAPIResponse<IMediaResponse>,
      { page?: number; limit?: number; category?: MediaCategory }
    >({
      query: ({ page = 1, limit = 100, category }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (category) params.append("category", category);
        return `/media?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data.items
          ? [
              ...result.data.items.map(({ _id }) => ({
                type: TagTypes.MEDIA as const,
                id: _id,
              })),
              { type: TagTypes.MEDIA, id: "LIST" },
            ]
          : [{ type: TagTypes.MEDIA, id: "LIST" }],
      // Merge logic for pagination
      serializeQueryArgs: ({ queryArgs }) => {
        return { category: queryArgs.category };
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: {
            ...newItems.data,
            items: [...currentCache.data.items, ...newItems.data.items],
          },
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.category !== previousArg?.category;
      },
    }),

    // Infinite query support (RTK Query built-in)
    getMediaPagesInfinite: builder.query<
      IAPIResponse<IMediaResponse>,
      { limit?: number; category?: MediaCategory; page?: number }
    >({
      query: ({ limit = 100, category, page = 1 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (category) params.append("category", category);
        return `/media?${params.toString()}`;
      },
      providesTags: [{ type: TagTypes.MEDIA, id: "LIST" }],
      serializeQueryArgs: ({ queryArgs }) => {
        return { category: queryArgs.category, limit: queryArgs.limit };
      },
      merge: (currentCache, newItems, { arg }) => {
        // If it's page 1, replace cache. Otherwise, append
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: {
            ...newItems.data,
            items: [...currentCache.data.items, ...newItems.data.items],
          },
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return (
          currentArg?.category !== previousArg?.category ||
          currentArg?.page !== previousArg?.page
        );
      },
    }),

    // Get single media item
    getMediaItem: builder.query<IAPIResponse<IMediaDto>, string>({
      query: (id) => `/media/${id}`,
      providesTags: (result, error, id) => [{ type: TagTypes.MEDIA, id }],
    }),

    // Upload media
    uploadMedia: builder.mutation<
      IAPIResponse<IMediaDto>,
      { formData: FormData }
    >({
      query: ({ formData }) => ({
        url: "/media",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: TagTypes.MEDIA, id: "LIST" }],
    }),

    // Update media metadata
    updateMedia: builder.mutation<
      IAPIResponse<IMediaDto>,
      { id: string; name?: string; category?: MediaCategory }
    >({
      query: ({ id, ...body }) => ({
        url: `/media/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: TagTypes.MEDIA, id },
        { type: TagTypes.MEDIA, id: "LIST" },
      ],
    }),

    // Delete media by ID
    deleteMedia: builder.mutation<IAPIResponse<void>, string>({
      query: (id) => ({
        url: `/media/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: TagTypes.MEDIA, id: "LIST" }],
    }),

    // Legacy: Delete by public_id (kept for backward compatibility)
    deleteMediaByPublicId: builder.mutation<IAPIResponse<void>, { public_id: string }>({
      query: (body) => ({
        url: "/media/delete",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: TagTypes.MEDIA, id: "LIST" }],
    }),

    // Transcribe image (AI feature)
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
  useGetMediaPagesInfiniteQuery,
  useGetMediaItemQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useDeleteMediaByPublicIdMutation,
  useTranscribeImageMutation,
} = mediaApi;
