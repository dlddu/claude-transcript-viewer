import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from './s3Client';

export interface Session {
  id: string;
  lastModified: string;
}

/**
 * List all session files from S3 bucket
 * @returns Promise<Session[]> - Array of sessions sorted by lastModified (newest first)
 */
export async function listSessions(): Promise<Session[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: '',
  });

  const response = await s3Client.send(command);

  // Handle empty or null Contents
  if (!response.Contents) {
    return [];
  }

  // Filter, map, and sort sessions
  const sessions = response.Contents
    .filter((item) => {
      // Must have Key and LastModified
      if (!item.Key || !item.LastModified) {
        return false;
      }

      // Must end with .jsonl
      if (!item.Key.endsWith('.jsonl')) {
        return false;
      }

      // Must not be in a subdirectory (no slashes in filename)
      if (item.Key.includes('/')) {
        return false;
      }

      return true;
    })
    .map((item) => {
      // Extract session ID by removing .jsonl extension
      const id = item.Key!.replace('.jsonl', '');

      return {
        id,
        lastModified: item.LastModified!.toISOString(),
      };
    })
    .sort((a, b) => {
      // Sort by lastModified in descending order (newest first)
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

  return sessions;
}
