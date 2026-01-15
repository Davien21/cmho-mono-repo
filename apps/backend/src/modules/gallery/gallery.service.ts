import mongoose from "mongoose";
import Gallery from "./gallery.model";
import { IGallery, GalleryRequest, GalleryCategory } from "./gallery.types";

class GalleryService {
  async list({
    page = 1,
    limit = 100,
    category,
  }: {
    page?: number;
    limit?: number;
    category?: GalleryCategory;
  } = {}) {
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: { $ne: true } };
    if (category) {
      filter.category = category;
    }

    // No need to populate media_id - imageUrl is denormalized and stored on the document
    const items = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Gallery.countDocuments(filter);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    return Gallery.findOne({ _id: id, isDeleted: { $ne: true } }).lean();
  }

  async findByMediaId(mediaId: string) {
    return Gallery.findOne({
      media_id: new mongoose.Types.ObjectId(mediaId),
      isDeleted: { $ne: true },
    }).lean();
  }

  async create(data: {
    media_id: string;
    name?: string | null;
    imageUrl?: string | null;
    category?: GalleryCategory;
  }) {
    console.log(`[GalleryService] Saving to DB with category: "${data.category || 'default:inventory'}"`);
    return Gallery.create({
      media_id: data.media_id,
      name: data.name,
      imageUrl: data.imageUrl,
      category: data.category || GalleryCategory.INVENTORY,
    });
  }

  async update(
    id: string,
    data: Partial<GalleryRequest>
  ): Promise<IGallery | null> {
    return Gallery.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      data,
      { new: true }
    ).lean();
  }

  async delete(id: string): Promise<IGallery | null> {
    return Gallery.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();
  }
}

export default new GalleryService();
