import Media from "./media.model";
import { IMedia, MediaCategory } from "../media/media.types";
import { deleteFromCloud } from "../../lib/cloudinary";
import logger from "../../config/logger";

class MediaService {
  /**
   * Get paginated list of media items
   * Replaces Gallery.list()
   */
  async list({
    page = 1,
    limit = 100,
    category,
  }: {
    page?: number;
    limit?: number;
    category?: MediaCategory;
  } = {}) {
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: { $ne: true } };
    if (category) {
      filter.category = category;
    }

    const items = await Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Media.countDocuments(filter);

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

  /**
   * Find all media (without pagination)
   * Updated to respect soft delete
   */
  findAll(category?: MediaCategory) {
    const filter: any = { isDeleted: { $ne: true } };
    if (category) filter.category = category;
    return Media.find(filter).sort({ createdAt: -1 });
  }

  findByUrl(url: string) {
    return Media.findOne({ url, isDeleted: { $ne: true } });
  }

  findById(id: string) {
    return Media.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  findByPublicId(public_id: string) {
    return Media.findOne({ public_id, isDeleted: { $ne: true } });
  }

  create(media: Partial<IMedia>) {
    return Media.create(media);
  }

  /**
   * Update media metadata (name, category)
   * Replaces Gallery.update()
   */
  async update(id: string, data: Partial<IMedia>) {
    return Media.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      data,
      { new: true }
    ).lean();
  }

  /**
   * Soft delete media
   * Replaces Gallery.delete()
   */
  async softDelete(id: string) {
    return Media.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();
  }

  /**
   * Hard delete media (remove from database)
   * Used for cleanup
   */
  delete(id: string) {
    return Media.findByIdAndDelete(id);
  }

  /**
   * Hard delete by public_id (also deletes from cloud)
   * Used by legacy endpoints
   */
  async deleteByPublicId(public_id: string) {
    const media = await Media.findOne({ public_id });
    if (!media) {
      throw new Error("Media not found");
    }
    await deleteFromCloud(public_id);
    return Media.findByIdAndDelete(media._id);
  }

  /**
   * Hard delete by URL (also deletes from cloud)
   * Used by legacy endpoints
   */
  async deleteByUrl(url: string) {
    try {
      const media = await Media.findOne({ url });
      console.log({ media });
      if (media) await deleteFromCloud(media.public_id);

      return Media.findOneAndDelete({ url });
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  /**
   * Hard delete by URL and cloud (alias for deleteByUrl)
   * Used by legacy endpoints
   */
  async deleteByUrlAndCloud(url: string) {
    return this.deleteByUrl(url);
  }
}

export default new MediaService();
