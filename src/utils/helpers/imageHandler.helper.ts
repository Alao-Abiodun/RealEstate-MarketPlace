import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Request } from'express';
import { nanoid } from "nanoid";
import sharp from "sharp";
import s3 from "../../config/s3.config";
import multer, { FileFilterCallback } from 'multer';
import { fileURLToPath } from 'url';
import path from "path";
import { tokenGenerator } from "../libs/keyGenerator";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

function fileFilter (req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!file.mimetype.startsWith('image')) {
      return cb(new Error("Only image is allowed."))
    }

    cb(null, true);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, tokenGenerator(6)  + path.extname(file.originalname))
  }
})

export const uploadFile = multer({
  fileFilter,
  storage, 
  limits: { fileSize: 1024 * 1024 * 2 }
})

export const uploadImageToS3 = async (files: any, uploadedBy: string) => {
    const fileArray = Array.isArray(files) ? files : [files];

    if (fileArray && fileArray.length === 0) {
      throw new Error("No image is uploaded");
    }
  
    const uploadPromises = await fileArray.map(async (file) => {
      const resizeBuffer = await resizeImage(file.path);
  
      return uploadToS3(resizeBuffer, file.mimetype, uploadedBy);
    });
  
    return Promise.all(uploadPromises);
};

const resizeImage = async (buffer) => {
  const res = await sharp(buffer)
    .resize(1600, 900, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
    return res;
};

const uploadToS3 = async (buffer, mimeType, uploadedBy) => {
  const metadata = await sharp(buffer).metadata();
  const fileExtension = metadata.format || "jpg";
  const Key = `${nanoid()}.${fileExtension}`;
  const Location = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
  const params = {
    Bucket: String(process.env.AWS_BUCKET_NAME),
    Key,
    Body: buffer,
    ContentType: mimeType,
  };
  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return { key: Location, Location, uploadedBy };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

export const deleteImageFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };
  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw new Error("Error removing image. Try again.");
  }
};
