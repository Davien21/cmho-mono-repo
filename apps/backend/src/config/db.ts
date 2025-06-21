import mongoose from "mongoose";
import { env } from "../config/env";
import logger from "../config/logger";

const db = env.DATABASE_URL;

const openDBConnection = () => {
  mongoose
    .connect(db)
    .then(() => {
      logger.info(`Connected to ${db}`);
    })
    .catch((err: Error) => {
      logger.error(err.message);
    });
};

export default openDBConnection;
