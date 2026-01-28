export interface Session {
  sessionId: string;
  lastModified: string;
}

export interface SessionListResponse {
  sessions: Session[];
}

export interface TranscriptRecord {
  [key: string]: unknown;
}

export interface TranscriptResponse {
  sessionId: string;
  records: TranscriptRecord[];
  subagentIds: string[];
}

export interface SubagentListResponse {
  sessionId: string;
  subagentIds: string[];
}

export interface SubagentTranscriptResponse {
  sessionId: string;
  agentId: string;
  records: TranscriptRecord[];
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
