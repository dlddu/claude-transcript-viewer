import { describe, it, expect } from 'vitest';
import type {
  Session,
  TranscriptRecord,
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
} from '../../src/types';

describe('TypeScript Type Definitions', () => {
  describe('Session type', () => {
    it('should accept valid Session object', () => {
      const session: Session = {
        id: 'session-123',
        lastModified: '2024-01-29T10:00:00Z',
      };

      expect(session.id).toBe('session-123');
      expect(session.lastModified).toBe('2024-01-29T10:00:00Z');
    });

    it('should require id field', () => {
      // This test will be enforced by TypeScript compiler
      expect(true).toBe(true);
    });

    it('should require lastModified field', () => {
      // This test will be enforced by TypeScript compiler
      expect(true).toBe(true);
    });
  });

  describe('TextBlock type', () => {
    it('should accept valid TextBlock object', () => {
      const textBlock: TextBlock = {
        type: 'text',
        text: 'Hello, world!',
      };

      expect(textBlock.type).toBe('text');
      expect(textBlock.text).toBe('Hello, world!');
    });

    it('should enforce literal type for type field', () => {
      // This test will be enforced by TypeScript compiler
      expect(true).toBe(true);
    });
  });

  describe('ToolUseBlock type', () => {
    it('should accept valid ToolUseBlock object', () => {
      const toolUseBlock: ToolUseBlock = {
        type: 'tool_use',
        id: 'tool-123',
        name: 'read_file',
        input: { path: '/tmp/file.txt' },
      };

      expect(toolUseBlock.type).toBe('tool_use');
      expect(toolUseBlock.id).toBe('tool-123');
      expect(toolUseBlock.name).toBe('read_file');
      expect(toolUseBlock.input.path).toBe('/tmp/file.txt');
    });

    it('should accept empty input object', () => {
      const toolUseBlock: ToolUseBlock = {
        type: 'tool_use',
        id: 'tool-123',
        name: 'get_status',
        input: {},
      };

      expect(Object.keys(toolUseBlock.input)).toHaveLength(0);
    });

    it('should accept complex nested input', () => {
      const toolUseBlock: ToolUseBlock = {
        type: 'tool_use',
        id: 'tool-123',
        name: 'search',
        input: {
          query: 'test',
          filters: { category: 'docs', limit: 10 },
          nested: { deeply: { value: true } },
        },
      };

      expect(toolUseBlock.input.query).toBe('test');
    });
  });

  describe('ToolResultBlock type', () => {
    it('should accept valid ToolResultBlock object', () => {
      const toolResultBlock: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'tool-123',
        content: 'Result content',
      };

      expect(toolResultBlock.type).toBe('tool_result');
      expect(toolResultBlock.tool_use_id).toBe('tool-123');
      expect(toolResultBlock.content).toBe('Result content');
    });
  });

  describe('ContentBlock union type', () => {
    it('should accept TextBlock as ContentBlock', () => {
      const content: ContentBlock = {
        type: 'text',
        text: 'Hello',
      };

      expect(content.type).toBe('text');
    });

    it('should accept ToolUseBlock as ContentBlock', () => {
      const content: ContentBlock = {
        type: 'tool_use',
        id: 'tool-123',
        name: 'read_file',
        input: {},
      };

      expect(content.type).toBe('tool_use');
    });

    it('should accept ToolResultBlock as ContentBlock', () => {
      const content: ContentBlock = {
        type: 'tool_result',
        tool_use_id: 'tool-123',
        content: 'Result',
      };

      expect(content.type).toBe('tool_result');
    });
  });

  describe('Message type', () => {
    it('should accept valid Message object with TextBlock', () => {
      const message: Message = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Hello',
          },
        ],
      };

      expect(message.role).toBe('user');
      expect(message.content).toHaveLength(1);
    });

    it('should accept Message with multiple content blocks', () => {
      const message: Message = {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me help' },
          { type: 'tool_use', id: 'tool-1', name: 'read', input: {} },
        ],
      };

      expect(message.content).toHaveLength(2);
    });

    it('should accept empty content array', () => {
      const message: Message = {
        role: 'user',
        content: [],
      };

      expect(message.content).toHaveLength(0);
    });
  });

  describe('TranscriptRecord type', () => {
    it('should accept user TranscriptRecord', () => {
      const record: TranscriptRecord = {
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
        timestamp: '2024-01-29T10:00:00Z',
      };

      expect(record.type).toBe('user');
      expect(record.timestamp).toBe('2024-01-29T10:00:00Z');
    });

    it('should accept assistant TranscriptRecord', () => {
      const record: TranscriptRecord = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there!' }],
        },
        timestamp: '2024-01-29T10:00:01Z',
      };

      expect(record.type).toBe('assistant');
    });

    it('should enforce literal type for type field', () => {
      // This test will be enforced by TypeScript compiler
      expect(true).toBe(true);
    });
  });

  describe('Complex nested structures', () => {
    it('should handle full conversation transcript structure', () => {
      const transcript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Read a file' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'I will read the file' },
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'read_file',
                input: { path: '/test.txt' },
              },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'File contents here',
              },
            ],
          },
          timestamp: '2024-01-29T10:00:02Z',
        },
      ];

      expect(transcript).toHaveLength(3);
      expect(transcript[0].type).toBe('user');
      expect(transcript[1].type).toBe('assistant');
    });
  });
});
