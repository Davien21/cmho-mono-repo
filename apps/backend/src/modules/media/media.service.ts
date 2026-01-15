import Media from "./media.model";
import { IMedia, MediaCategory } from "../media/media.types";
import { deleteFromCloud } from "../../lib/cloudinary";
import logger from "../../config/logger";

class MediaService {
  findAll(category?: MediaCategory) {
    const filter = category ? { category } : {};
    return Media.find(filter).sort({ createdAt: -1 });
  }

  findByUrl(url: string) {
    return Media.findOne({ url });
  }

  findById(id: string) {
    return Media.findById(id);
  }

  findByPublicId(public_id: string) {
    return Media.findOne({ public_id });
  }

  create(media: Partial<IMedia>) {
    return Media.create(media);
  }

  delete(id: string) {
    return Media.findByIdAndDelete(id);
  }

  async deleteByPublicId(public_id: string) {
    const media = await this.findByPublicId(public_id);
    if (!media) {
      throw new Error("Media not found");
    }
    await deleteFromCloud(public_id);
    return Media.findByIdAndDelete(media._id);
  }

  async deleteByUrl(url: string) {
    try {
      const media = await this.findByUrl(url);
      console.log({ media });
      if (media) await deleteFromCloud(media.public_id);

      return Media.findOneAndDelete({ url });
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  async deleteByUrlAndCloud(url: string) {
    try {
      const media = await this.findByUrl(url);
      console.log({ media });
      if (media) await deleteFromCloud(media.public_id);

      return Media.findOneAndDelete({ url });
    } catch (error) {
      logger.error(error);
      return null;
    }
  }
}

export default new MediaService();
