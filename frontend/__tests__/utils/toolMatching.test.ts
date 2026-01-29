import { describe, it, expect } from 'vitest';
import { matchToolCalls } from '../../src/utils/toolMatching';
import type {
  TranscriptRecord,
  ToolUseBlock,
  ToolResultBlock,
} from '../../src/types';

describe('Tool Matching Utility', () => {
  describe('matchToolCalls function', () => {
    describe('normal matching', () => {
      it('should match tool_use with corresponding tool_result', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
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
                  input: { path: '/tmp/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'File contents here',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].toolUse.id).toBe('tool-1');
        expect(result[0].toolUse.name).toBe('read_file');
        expect(result[0].toolResult).not.toBeNull();
        expect(result[0].toolResult?.tool_use_id).toBe('tool-1');
        expect(result[0].toolResult?.content).toBe('File contents here');
        expect(result[0].isError).toBe(false);
      });

      it('should match multiple tool calls correctly', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'read_file',
                  input: { path: '/file1.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'write_file',
                  input: { path: '/file2.txt', content: 'data' },
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Contents of file1',
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'File written successfully',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].toolUse.id).toBe('tool-1');
        expect(result[0].toolResult?.tool_use_id).toBe('tool-1');
        expect(result[0].isError).toBe(false);
        expect(result[1].toolUse.id).toBe('tool-2');
        expect(result[1].toolResult?.tool_use_id).toBe('tool-2');
        expect(result[1].isError).toBe(false);
      });

      it('should preserve tool_use input data', () => {
        // Arrange
        const complexInput = {
          path: '/complex/path.txt',
          options: { recursive: true, depth: 3 },
          filters: ['*.ts', '*.tsx'],
        };

        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-complex',
                  name: 'search',
                  input: complexInput,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-complex',
                  content: 'Search results',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result[0].toolUse.input).toEqual(complexInput);
        expect(result[0].toolUse.input.options).toEqual({
          recursive: true,
          depth: 3,
        });
      });
    });

    describe('missing tool_result', () => {
      it('should set toolResult to null when no matching tool_result exists', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-orphan',
                  name: 'pending_operation',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].toolUse.id).toBe('tool-orphan');
        expect(result[0].toolResult).toBeNull();
        expect(result[0].isError).toBe(false);
      });

      it('should handle mix of matched and unmatched tool calls', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'completed_op',
                  input: {},
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'pending_op',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Operation completed',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].toolUse.id).toBe('tool-1');
        expect(result[0].toolResult).not.toBeNull();
        expect(result[1].toolUse.id).toBe('tool-2');
        expect(result[1].toolResult).toBeNull();
      });
    });

    describe('error handling with is_error flag', () => {
      it('should set isError to true when tool_result has is_error=true', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-fail',
                  name: 'failing_operation',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-fail',
                  content: 'Error: Operation failed',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].isError).toBe(true);
        expect(result[0].toolResult?.is_error).toBe(true);
      });

      it('should set isError to false when tool_result has is_error=false', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-success',
                  name: 'successful_operation',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-success',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].isError).toBe(false);
        expect(result[0].toolResult?.is_error).toBe(false);
      });

      it('should set isError to false when is_error field is undefined', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-no-error-field',
                  name: 'operation',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-no-error-field',
                  content: 'Result',
                  // is_error field is not present
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].isError).toBe(false);
      });

      it('should handle multiple errors correctly', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'op1',
                  input: {},
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'op2',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Error occurred',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].isError).toBe(false);
        expect(result[1].isError).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should return empty array when input is empty', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toEqual([]);
      });

      it('should return empty array when no tool_use blocks exist', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Just a text message' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle only tool_result blocks (no matching tool_use)', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'orphan-result',
                  content: 'Result without matching use',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle mixed content blocks correctly', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Let me do this' },
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'operation',
                  input: {},
                },
                { type: 'text', text: 'And also this' },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'another_op',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Here are results' },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Result 1',
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Result 2',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].toolUse.id).toBe('tool-1');
        expect(result[0].toolResult?.tool_use_id).toBe('tool-1');
        expect(result[1].toolUse.id).toBe('tool-2');
        expect(result[1].toolResult?.tool_use_id).toBe('tool-2');
      });

      it('should handle tool calls across multiple assistant messages', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'first_op',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'First result',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'second_op',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:02Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Second result',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:03Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].toolUse.id).toBe('tool-1');
        expect(result[0].toolResult?.content).toBe('First result');
        expect(result[1].toolUse.id).toBe('tool-2');
        expect(result[1].toolResult?.content).toBe('Second result');
      });

      it('should handle empty content arrays', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('order preservation', () => {
      it('should preserve the order of tool_use blocks', () => {
        // Arrange
        const transcriptRecords: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'third',
                  input: {},
                },
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'first',
                  input: {},
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'second',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Result 1',
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Result 2',
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'Result 3',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const result = matchToolCalls(transcriptRecords);

        // Assert
        expect(result).toHaveLength(3);
        expect(result[0].toolUse.id).toBe('tool-3');
        expect(result[1].toolUse.id).toBe('tool-1');
        expect(result[2].toolUse.id).toBe('tool-2');
      });
    });
  });
});
