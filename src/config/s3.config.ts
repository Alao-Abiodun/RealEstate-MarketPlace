import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId: String(process.env.AWS_S3_BUCKET_ID), 
        secretAccessKey: String(process.env.AWS_S3_BUCKET_SECRET), 
    }
});

export default s3;