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

const closeDBConnection = () => {
  mongoose.connection
    .close(false)
    .then(() => {
      logger.info("MongoDB connection closed.");
      process.exit(0);
    })
    .catch((closeErr: Error) => {
      logger.error(`Error closing MongoDB connection: ${closeErr.message}`);
      process.exit(1);
    });
};

export { openDBConnection, closeDBConnection };
