import { TranscriptRecord } from '../types/transcript';

export function parseJsonl(content: string): TranscriptRecord[] {
  if (!content || content.trim() === '') {
    return [];
  }

  const lines = content.split('\n');
  const records: TranscriptRecord[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    try {
      const record = JSON.parse(trimmedLine);
      records.push(record);
    } catch {
      console.warn('Skipping malformed JSON line:', trimmedLine.substring(0, 50));
    }
  }

  return records;
}
