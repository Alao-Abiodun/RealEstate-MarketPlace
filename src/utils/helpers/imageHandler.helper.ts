import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import sharp from "sharp";
import s3 from "../../config/s3.config";
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __direname = path.dirname(__filename)

function fileFilter (req: Request, file: any, cb: any) {
    if (!file.mimetype.start('image')) {
      return cb(new Error("Only image is allowed."))
    }

    cb(null, true);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__direname, '../../uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, path.extname(file.originalname) + '-' + uniqueSuffix)
  }
})

export const uploadFile = multer({
  fileFilter,
  storage, 
  limits: { fileSize: 1024 * 1024 * 2 }
})

export const uploadImageToS3 = async (files: any, uploadedBy: string) => {
  if (!files || files.length === 0) {
    throw new Error("No image is uploaded");
  }

  const fileArray = Array.isArray(files) ? files : [files];

  const uploadPromises = fileArray.map(async (file) => {
    const resizeBuffer = await resizeImage(file.buffer);

    return uploadToS3(resizeBuffer, file.mimetype, uploadedBy);
  });

  return Promise.all(uploadPromises);
};

const resizeImage = async (buffer) => {
  return sharp(buffer)
    .resize(1600, 900, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
};

const uploadToS3 = async (buffer, mimeType, uploadedBy) => {
  const metadata = await sharp(buffer).metadata();
  const fileExtension = metadata.format || "jpg"; // Use format if available, default to jpg
  const Key = `${nanoid()}.${fileExtension}`;
  const Location = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
    Body: buffer,
    ContentType: mimeType,
  };
  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return { Key, Location, uploadedBy };
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
