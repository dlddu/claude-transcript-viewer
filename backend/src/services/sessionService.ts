import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from './s3Client';

export interface Session {
  id: string;
  lastModified: string;
}

export interface TranscriptRecord {
  type: string;
  message: any;
  timestamp: string;
  [key: string]: any;
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

/**
 * Get transcript records for a specific session
 * @param sessionId - The session ID
 * @returns Promise<TranscriptRecord[]> - Array of transcript records
 */
export async function getTranscript(sessionId: string): Promise<TranscriptRecord[]> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${sessionId}.jsonl`,
  });

  const response = await s3Client.send(command);

  // Convert stream to string
  if (!response.Body) {
    return [];
  }

  const bodyString = await response.Body.transformToString();

  // Parse JSONL (line by line)
  if (!bodyString || bodyString.trim() === '') {
    return [];
  }

  const lines = bodyString.split('\n');
  const records: TranscriptRecord[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      continue; // Skip empty lines
    }

    try {
      const record = JSON.parse(trimmedLine);
      records.push(record);
    } catch (error) {
      // If a line fails to parse, throw an error
      throw new Error(`Failed to parse JSON line: ${trimmedLine}`);
    }
  }

  return records;
}
