import type { ToolUseBlock, ToolResultBlock } from '../types';

export function isSubagentCall(toolUse: ToolUseBlock): boolean {
  return toolUse.name === 'Task';
}

export function extractAgentId(toolResult: ToolResultBlock): string | null {
  // is_error가 true면 null 반환
  if (toolResult.is_error === true) {
    return null;
  }

  try {
    // JSON 파싱 시도
    const parsed = JSON.parse(toolResult.content);

    // 객체가 아니면 null 반환 (배열이나 primitive)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    // agentId 필드 확인
    if (!('agentId' in parsed)) {
      return null;
    }

    const agentId = parsed.agentId;

    // agentId가 문자열인지 확인
    if (typeof agentId !== 'string') {
      return null;
    }

    return agentId;
  } catch {
    // JSON 파싱 실패
    return null;
  }
}
