import { baseApi } from "@/store/api-slice";
import { IAPIResponse, IQueryMeta } from "@/types";
import { TagTypes } from "@/store/tags";
import { IMediaDto } from "./media-slice";

export enum GalleryCategory {
  INVENTORY = "inventory",
  BALANCES = "balance_sheet",
  STOCK_UPDATES = "stock_update",
}

export interface IGalleryDto {
  _id: string;
  media_id: IMediaDto | string; // Can be populated media object or just the ID
  name?: string;
  imageUrl?: string;
  category?: GalleryCategory;
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
      { page?: number; limit?: number; category?: GalleryCategory }
    >({
      query: ({ page = 1, limit = 100, category } = {}) => ({
        url: "/gallery",
        method: "GET",
        params: { page, limit, ...(category && { category }) },
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
          currentArg?.limit !== previousArg?.limit ||
          currentArg?.category !== previousArg?.category
        );
      },
    }),
    getGalleryPages: builder.infiniteQuery<
      IAPIResponse<IGalleryResponse>,
      { limit?: number; category?: GalleryCategory },
      number
    >({
      query: ({ pageParam, ...queryArg }) => ({
        url: "/gallery",
        method: "GET",
        params: {
          page: pageParam,
          limit: queryArg?.limit || 100,
          ...(queryArg?.category && { category: queryArg.category }),
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
      {
        file?: File;
        formData?: FormData;
        name?: string;
        category?: GalleryCategory;
      }
    >({
      query: ({
        file: newFile,
        formData: originalFormData,
        name,
        category,
      }) => {
        const formData = new FormData();

        // 1. Get values from either params or existing formData
        const finalName = name || (originalFormData?.get("name") as string);
        const finalCategory =
          category || (originalFormData?.get("category") as GalleryCategory);
        const finalFile = newFile || (originalFormData?.get("file") as File);

        // 2. Append text fields FIRST (critical for backend multipart parsing)
        if (finalName) {
          formData.append("name", finalName);
        }
        if (finalCategory) {
          formData.append("category", finalCategory);
        }

        // 3. Append file LAST
        if (finalFile) {
          formData.append("file", finalFile);
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
