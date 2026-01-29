import type { TranscriptRecord } from '../types';

export interface TranscriptStats {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  byTool: {
    name: string;
    count: number;
    errors: number;
  }[];
}

export function calculateTranscriptStats(
  records: TranscriptRecord[]
): TranscriptStats {
  // Step 1: Collect all tool_use blocks with their names
  const toolUseMap = new Map<
    string,
    { name: string; id: string }
  >();

  for (const record of records) {
    for (const block of record.message.content) {
      if (block.type === 'tool_use') {
        toolUseMap.set(block.id, {
          name: block.name,
          id: block.id,
        });
      }
    }
  }

  const totalCalls = toolUseMap.size;

  // Step 2: Collect all tool_result blocks
  const toolResultMap = new Map<string, boolean>();

  for (const record of records) {
    for (const block of record.message.content) {
      if (block.type === 'tool_result') {
        const isError = block.is_error === true;
        toolResultMap.set(block.tool_use_id, isError);
      }
    }
  }

  // Step 3: Calculate success and failure counts
  let successCount = 0;
  let failureCount = 0;

  for (const [toolUseId] of toolUseMap) {
    const isError = toolResultMap.get(toolUseId);

    if (isError === true) {
      failureCount++;
    } else if (isError === false) {
      successCount++;
    }
    // If no matching result, treat as success (per requirements)
  }

  // Step 4: Calculate success rate
  const successRate =
    totalCalls === 0 ? 0 : Math.round((successCount / totalCalls) * 10000) / 100;

  // Step 5: Aggregate by tool name
  const toolStatsMap = new Map<
    string,
    { count: number; errors: number }
  >();

  for (const [toolUseId, toolInfo] of toolUseMap) {
    const { name } = toolInfo;

    if (!toolStatsMap.has(name)) {
      toolStatsMap.set(name, { count: 0, errors: 0 });
    }

    const stats = toolStatsMap.get(name)!;
    stats.count++;

    const isError = toolResultMap.get(toolUseId);
    if (isError === true) {
      stats.errors++;
    }
  }

  // Step 6: Convert to array and sort alphabetically
  const byTool = Array.from(toolStatsMap.entries())
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      errors: stats.errors,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalCalls,
    successCount,
    failureCount,
    successRate,
    byTool,
  };
}
