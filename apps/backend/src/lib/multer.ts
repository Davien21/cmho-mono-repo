import { Request } from "express";

import multer, { FileFilterCallback } from "multer";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

import fs from "fs";
import { BadRequestError } from "../config/errors";
import { DocMimeTypes, MediaMimeTypes, allMimeTypes } from "../utils/helpers";
import { env } from "../config/env";

//adjust how files are stored
const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: DestinationCallback
  ) {
    let dir = process.cwd();
    // console.log(file.mimetype);
    //Sets destination for fileType
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/webp" ||
      file.mimetype === "image/heic" ||
      file.mimetype === "image/heif"
    ) {
      dir = env.NODE_ENV === "production" ? `/tmp` : dir + "/uploads/images";
    } else {
      dir = env.NODE_ENV === "production" ? `/tmp` : dir + "/uploads/docs";
    }

    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename: function (req, file, callback: FileNameCallback) {
    callback(null, Date.now() + "_" + file.originalname);
  },
});

const generalFileFilter = function (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) {
  if (allMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestError(
        "File upload failed. Supports only jpeg, png, webp, heic, pdf, docs, mp4 and webm"
      )
    );
  }
};

const mediaFileFilter = function (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) {
  if (MediaMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestError("Image upload failed. Supports only jpeg, png, webp, and heic")
    );
  }
};

const docFileFilter = function (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) {
  if (DocMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestError("Document upload failed. Supports only pdf and docs")
    );
  }
};

const mediaMulter = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: mediaFileFilter,
});

const docMulter = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 250 },
  fileFilter: docFileFilter,
});

const generalMulter = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 250 },
  fileFilter: generalFileFilter,
});

export { mediaMulter, docMulter, generalMulter };
