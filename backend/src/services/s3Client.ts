import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// Validate and process environment variables
const bucketName = process.env.TRANSCRIPT_BUCKET?.trim();
if (!bucketName) {
  throw new Error('TRANSCRIPT_BUCKET environment variable is required');
}

const region = process.env.AWS_REGION?.trim() || 'ap-northeast-2';

// Create S3Client singleton instance
export const s3Client = new S3Client({
  region: region,
});

// Export bucket name constant
export const BUCKET_NAME = bucketName;

/**
 * Test S3 connection by checking if the bucket is accessible
 * @returns Promise<boolean> - true if bucket is accessible, false otherwise
 */
export async function testS3Connection(): Promise<boolean> {
  try {
    const command = new HeadBucketCommand({
      Bucket: BUCKET_NAME,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 connection test failed:', error);
    return false;
  }
}
