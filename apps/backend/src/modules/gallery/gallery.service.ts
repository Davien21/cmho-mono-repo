import mongoose from "mongoose";
import Gallery from "./gallery.model";
import { IGallery, GalleryRequest } from "./gallery.types";

class GalleryService {
  async list({
    page = 1,
    limit = 100,
  }: {
    page?: number;
    limit?: number;
  } = {}) {
    const skip = (page - 1) * limit;

    // No need to populate media_id - imageUrl is denormalized and stored on the document
    const items = await Gallery.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Gallery.countDocuments();

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
    return Gallery.findById(id).lean();
  }

  async findByMediaId(mediaId: string) {
    return Gallery.findOne({
      media_id: new mongoose.Types.ObjectId(mediaId),
    }).lean();
  }

  async create(data: {
    media_id: string;
    name?: string | null;
    imageUrl?: string | null;
  }) {
    return Gallery.create({
      media_id: data.media_id,
      name: data.name,
      imageUrl: data.imageUrl,
    });
  }

  async update(
    id: string,
    data: Partial<GalleryRequest>
  ): Promise<IGallery | null> {
    return Gallery.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string): Promise<IGallery | null> {
    return Gallery.findByIdAndDelete(id);
  }
}

export default new GalleryService();
