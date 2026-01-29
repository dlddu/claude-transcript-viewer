import type { TranscriptRecord, ToolUseBlock, ToolResultBlock } from '../types';

export interface ToolStats {
  name: string;
  count: number;
  errors: number;
}

export interface TranscriptStats {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  byTool: ToolStats[];
}

export function calculateTranscriptStats(records: TranscriptRecord[]): TranscriptStats {
  // Collect all tool_use and tool_result blocks
  const toolUseBlocks: ToolUseBlock[] = [];
  const toolResultBlocks: ToolResultBlock[] = [];

  for (const record of records) {
    for (const block of record.message.content) {
      if (block.type === 'tool_use') {
        toolUseBlocks.push(block as ToolUseBlock);
      } else if (block.type === 'tool_result') {
        toolResultBlocks.push(block as ToolResultBlock);
      }
    }
  }

  // Total calls = number of tool_use blocks
  const totalCalls = toolUseBlocks.length;

  // Create a map of tool_result by tool_use_id for easy lookup
  const resultMap = new Map<string, ToolResultBlock>();
  for (const result of toolResultBlocks) {
    resultMap.set(result.tool_use_id, result);
  }

  // Count successes and failures
  let successCount = 0;
  let failureCount = 0;

  // Group by tool name for byTool stats
  const toolStatsMap = new Map<string, { count: number; errors: number }>();

  for (const toolUse of toolUseBlocks) {
    // Initialize tool stats if not exists
    if (!toolStatsMap.has(toolUse.name)) {
      toolStatsMap.set(toolUse.name, { count: 0, errors: 0 });
    }
    const stats = toolStatsMap.get(toolUse.name)!;
    stats.count++;

    // Check if there's a matching result
    const result = resultMap.get(toolUse.id);
    if (result) {
      // is_error === true means failure, otherwise success
      if (result.is_error === true) {
        failureCount++;
        stats.errors++;
      } else {
        successCount++;
      }
    }
  }

  // Calculate success rate
  // Success rate is based on tools that have results
  const totalWithResults = successCount + failureCount;
  const successRate = totalWithResults === 0 ? 0 : (successCount / totalWithResults) * 100;

  // Convert toolStatsMap to array and sort alphabetically
  const byTool: ToolStats[] = Array.from(toolStatsMap.entries())
    .map(([name, { count, errors }]) => ({
      name,
      count,
      errors,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalCalls,
    successCount,
    failureCount,
    successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    byTool,
  };
}
