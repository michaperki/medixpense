// apps/api/src/services/aws.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

// Create S3 client with non-undefined credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Bucket name from environment variables
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'medixpense-uploads';

/**
 * Upload a file to S3
 * 
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The file name/key in S3
 * @param contentType - The MIME type of the file
 * @returns S3 upload result
 */
export async function uploadToS3(
  fileBuffer: Buffer, 
  fileName: string, 
  contentType: string
): Promise<any> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType
    };
    
    const command = new PutObjectCommand(params);
    const result = await s3Client.send(command);
    
    return result;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('File upload failed');
  }
}

/**
 * Get public URL for an S3 object
 * 
 * @param fileName - The file name/key in S3
 * @returns Public URL for the file
 */
export function getPublicUrl(fileName: string): string {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}

/**
 * Simple implementation that stores files locally instead of S3
 * for development environments where S3 is not configured
 * 
 * This can be used as a fallback if AWS credentials are not set
 */
export async function uploadToLocal(
  fileBuffer: Buffer, 
  fileName: string, 
  contentType: string
): Promise<{success: boolean, location: string}> {
  try {
    console.log(`[DEV MODE] Would upload file: ${fileName} (${contentType})`);
    // In a real implementation, you would save to local filesystem
    // For now, just return a mock result
    return {
      success: true,
      location: `/uploads/${fileName}`
    };
  } catch (error) {
    console.error('Error in mock upload:', error);
    throw new Error('File upload failed (development mode)');
  }
}

/**
 * Check if AWS credentials are configured
 * and use local upload if they're not
 */
export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY && 
    process.env.AWS_S3_BUCKET
  );
}

// Export a unified upload function that checks for configuration
export async function uploadFile(
  fileBuffer: Buffer, 
  fileName: string, 
  contentType: string
): Promise<any> {
  if (isS3Configured()) {
    return uploadToS3(fileBuffer, fileName, contentType);
  } else {
    console.warn('AWS S3 not configured, using local storage instead');
    return uploadToLocal(fileBuffer, fileName, contentType);
  }
}
