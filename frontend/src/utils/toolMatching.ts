import type { TranscriptRecord, MatchedToolCall } from '../types';

/**
 * Matches tool_use blocks with their corresponding tool_result blocks
 * @param records - Array of TranscriptRecord containing assistant messages
 * @returns Array of MatchedToolCall objects with paired tool use/result
 */
export function matchToolCalls(records: TranscriptRecord[]): MatchedToolCall[] {
  // Step 1: Collect all tool_use blocks (preserving order)
  const toolUseBlocks: Array<{ block: any; }> = [];

  for (const record of records) {
    // Ensure content is an array before processing
    if (!Array.isArray(record.message.content)) {
      continue;
    }

    for (const block of record.message.content) {
      if (block.type === 'tool_use') {
        toolUseBlocks.push({ block });
      }
    }
  }

  // Step 2: Collect all tool_result blocks into a Map for fast lookup
  const toolResultMap = new Map<string, any>();

  for (const record of records) {
    // Ensure content is an array before processing
    if (!Array.isArray(record.message.content)) {
      continue;
    }

    for (const block of record.message.content) {
      if (block.type === 'tool_result') {
        toolResultMap.set(block.tool_use_id, block);
      }
    }
  }

  // Step 3: Match tool_use blocks with their corresponding tool_result blocks
  const matchedToolCalls: MatchedToolCall[] = toolUseBlocks.map(({ block }) => {
    const toolResult = toolResultMap.get(block.id) || null;

    // Determine isError based on tool_result.is_error flag
    // - If toolResult is null, isError = false
    // - If is_error === true, isError = true
    // - If is_error === false or undefined, isError = false
    const isError = toolResult !== null && toolResult.is_error === true;

    return {
      toolUse: block,
      toolResult,
      isError,
    };
  });

  return matchedToolCalls;
}
