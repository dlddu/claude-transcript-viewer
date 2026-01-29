import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from './s3Client';

export interface SubagentInfo {
  agentId: string;
  type: string;
}

export interface SubagentRecord {
  type: string;
  [key: string]: any;
}

/**
 * List all subagents for a specific session
 * @param sessionId - The session ID
 * @returns Promise<SubagentInfo[]> - Array of subagent info with agentId and type
 */
export async function listSubagents(sessionId: string): Promise<SubagentInfo[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: `${sessionId}/subagents/`,
  });

  const response = await s3Client.send(command);

  // Handle empty or null Contents
  if (!response.Contents) {
    return [];
  }

  // Filter files matching agent-*.jsonl pattern
  const agentFiles = response.Contents.filter((item) => {
    if (!item.Key) {
      return false;
    }

    const filename = item.Key.split('/').pop();
    if (!filename) {
      return false;
    }

    // Match pattern: agent-{agentId}.jsonl
    return /^agent-.+\.jsonl$/.test(filename);
  });

  // Extract agentId and type from each file
  const subagents: SubagentInfo[] = [];

  for (const file of agentFiles) {
    const filename = file.Key!.split('/').pop()!;

    // Extract agentId from filename: agent-{agentId}.jsonl
    const agentId = filename.replace(/^agent-/, '').replace(/\.jsonl$/, '');

    // Get the first line to extract type
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.Key!,
    });

    const fileResponse = await s3Client.send(getCommand);

    if (!fileResponse.Body) {
      throw new Error(`File ${file.Key} has no body`);
    }

    const bodyString = await fileResponse.Body.transformToString();

    if (!bodyString || bodyString.trim() === '') {
      throw new Error(`File ${file.Key} is empty`);
    }

    const firstLine = bodyString.split('\n')[0].trim();

    if (!firstLine) {
      throw new Error(`File ${file.Key} has no valid first line`);
    }

    try {
      const firstRecord = JSON.parse(firstLine);

      if (!firstRecord.type) {
        throw new Error(`File ${file.Key} first record has no type field`);
      }

      subagents.push({
        agentId,
        type: firstRecord.type,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON in file ${file.Key}`);
      }
      throw error;
    }
  }

  return subagents;
}

/**
 * Get all records for a specific subagent
 * @param sessionId - The session ID
 * @param agentId - The agent ID
 * @returns Promise<SubagentRecord[]> - Array of subagent records
 */
export async function getSubagent(sessionId: string, agentId: string): Promise<SubagentRecord[]> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${sessionId}/subagents/agent-${agentId}.jsonl`,
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
  const records: SubagentRecord[] = [];

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
