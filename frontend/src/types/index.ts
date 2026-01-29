export interface Session {
  id: string;
  lastModified: string;
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface Message {
  role: string;
  content: ContentBlock[];
}

export interface TranscriptRecord {
  type: 'user' | 'assistant';
  message: Message;
  timestamp: string;
}
