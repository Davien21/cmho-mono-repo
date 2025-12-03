import Media from "./media.model";
import { IMedia } from "../media/media.types";
import { deleteFromCloud } from "../../lib/cloudinary";
import logger from "../../config/logger";

class MediaService {
  findAll() {
    return Media.find().sort({ createdAt: -1 });
  }

  findByUrl(url: string) {
    return Media.findOne({ url });
  }

  findById(id: string) {
    return Media.findById(id);
  }

  create(media: IMedia) {
    return Media.create(media);
  }

  delete(id: string) {
    return Media.findByIdAndDelete(id);
  }

  async deleteByUrl(url: string) {
    try {
      const media: IMedia = await this.findByUrl(url);
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
      const media: IMedia = await this.findByUrl(url);
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
