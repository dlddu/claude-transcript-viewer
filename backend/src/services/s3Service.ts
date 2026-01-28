import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { Session } from '../types/transcript';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const BUCKET_NAME = process.env.TRANSCRIPT_BUCKET || '';

export async function listSessions(): Promise<Session[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Delimiter: '/',
  });

  const response: ListObjectsV2CommandOutput = await s3Client.send(command);
  const sessions: Session[] = [];

  if (response.Contents) {
    for (const obj of response.Contents) {
      if (obj.Key && obj.Key.endsWith('.jsonl') && !obj.Key.includes('/')) {
        const sessionId = obj.Key.replace('.jsonl', '');
        sessions.push({
          sessionId,
          lastModified: obj.LastModified?.toISOString() || '',
        });
      }
    }
  }

  // Sort by lastModified in descending order (newest first)
  // Sessions with undefined/empty lastModified are placed at the end
  sessions.sort((a, b) => {
    // Handle empty lastModified (should be at the end)
    if (!a.lastModified && !b.lastModified) return 0;
    if (!a.lastModified) return 1;
    if (!b.lastModified) return -1;

    // Parse dates and compare (descending order)
    const dateA = new Date(a.lastModified).getTime();
    const dateB = new Date(b.lastModified).getTime();
    return dateB - dateA;
  });

  return sessions;
}

export async function getTranscript(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('Empty response body');
  }

  return await response.Body.transformToString();
}

export async function listSubagents(sessionId: string): Promise<string[]> {
  const prefix = `${sessionId}/subagents/`;
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response: ListObjectsV2CommandOutput = await s3Client.send(command);
  const agentIds: string[] = [];

  if (response.Contents) {
    for (const obj of response.Contents) {
      if (obj.Key) {
        const match = obj.Key.match(/agent-([^/]+)\.jsonl$/);
        if (match) {
          agentIds.push(match[1]);
        }
      }
    }
  }

  return agentIds;
}

export async function getSubagentTranscript(
  sessionId: string,
  agentId: string
): Promise<string> {
  const key = `${sessionId}/subagents/agent-${agentId}.jsonl`;
  return getTranscript(key);
}

export async function testBucketAccess(): Promise<boolean> {
  if (!BUCKET_NAME) {
    return false;
  }

  try {
    const command = new HeadBucketCommand({
      Bucket: BUCKET_NAME,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

export { s3Client };
