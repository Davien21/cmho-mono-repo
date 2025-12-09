import { baseApi } from "@/store/api-slice";
import { IAPIResponse, IQueryMeta } from "@/types";
import { TagTypes } from "@/store/tags";
import { IMediaDto } from "./media-slice";

export interface IGalleryDto {
  _id: string;
  media_id: IMediaDto | string; // Can be populated media object or just the ID
  name?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGalleryResponse {
  items: IGalleryDto[];
  meta: IQueryMeta;
}

export const galleryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGallery: builder.query<
      IAPIResponse<IGalleryResponse>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 100 } = {}) => ({
        url: "/gallery",
        method: "GET",
        params: { page, limit },
      }),
      providesTags: [TagTypes.GALLERY],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (newItems.data.meta.page === 1) {
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
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.page !== previousArg?.page ||
          currentArg?.limit !== previousArg?.limit
        );
      },
    }),
    getGalleryPages: builder.infiniteQuery<
      IAPIResponse<IGalleryResponse>,
      { limit?: number },
      number
    >({
      query: ({ pageParam, ...queryArg }) => ({
        url: "/gallery",
        method: "GET",
        params: {
          page: pageParam,
          limit: queryArg?.limit || 100,
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
          const totalPages = lastPage.data.meta.totalPages;
          const currentPage = allPages.length;
          return currentPage < totalPages ? currentPage + 1 : undefined;
        },
      },
      providesTags: [TagTypes.GALLERY],
    }),
    getGalleryItem: builder.query<IAPIResponse<IGalleryDto>, string>({
      query: (id) => ({
        url: `/gallery/${id}`,
        method: "GET",
      }),
      providesTags: [TagTypes.GALLERY],
    }),
    uploadGallery: builder.mutation<
      IAPIResponse<IGalleryDto>,
      { formData: FormData; name?: string }
    >({
      query: ({ formData, name }) => {
        // Append name to formData if provided
        if (name) {
          formData.append("name", name);
        }
        return {
          url: "/gallery",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [TagTypes.GALLERY],
    }),
    updateGallery: builder.mutation<
      IAPIResponse<IGalleryDto>,
      { id: string; name?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/gallery/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [TagTypes.GALLERY],
    }),
    deleteGallery: builder.mutation<IAPIResponse<void>, string>({
      query: (id) => ({
        url: `/gallery/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.GALLERY],
    }),
  }),
});

export const {
  useGetGalleryQuery,
  useGetGalleryPagesInfiniteQuery,
  useGetGalleryItemQuery,
  useUploadGalleryMutation,
  useUpdateGalleryMutation,
  useDeleteGalleryMutation,
} = galleryApi;
