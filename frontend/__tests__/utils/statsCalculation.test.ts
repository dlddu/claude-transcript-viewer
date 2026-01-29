import { describe, it, expect } from 'vitest';
import { calculateTranscriptStats } from '../../src/utils/statsCalculation';
import type { TranscriptRecord } from '../../src/types';

describe('Stats Calculation Utility', () => {

  describe('calculateTranscriptStats function', () => {

    describe('Empty Input Handling', () => {
      it('should return zero stats when records array is empty', () => {
        // Arrange
        const records: TranscriptRecord[] = [];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(0);
        expect(stats.successCount).toBe(0);
        expect(stats.failureCount).toBe(0);
        expect(stats.successRate).toBe(0);
        expect(stats.byTool).toEqual([]);
      });

      it('should return zero stats when records contain no tool_use blocks', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello there!' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(0);
        expect(stats.successCount).toBe(0);
        expect(stats.failureCount).toBe(0);
        expect(stats.successRate).toBe(0);
        expect(stats.byTool).toEqual([]);
      });
    });

    describe('Total Calls Calculation', () => {
      it('should count single tool call correctly', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'File content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(1);
      });

      it('should count multiple tool calls correctly', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/file1.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Write',
                  input: { file_path: '/file2.txt', content: 'data' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Bash',
                  input: { command: 'ls' },
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
                  content: 'File content',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Written',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'file1.txt\nfile2.txt',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(3);
      });

      it('should count tool calls across multiple assistant messages', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Content',
                  is_error: false,
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
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
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
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:03Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(2);
      });

      it('should ignore text blocks when counting tool calls', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Let me read the file' },
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
                { type: 'text', text: 'Done reading' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(1);
      });

      it('should count tool calls even without matching tool_result', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(2);
      });
    });

    describe('Success and Failure Count Calculation', () => {
      it('should count successful tool calls correctly', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
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
                  content: 'Content',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Written',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successCount).toBe(2);
        expect(stats.failureCount).toBe(0);
      });

      it('should count failed tool calls correctly', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
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
                  content: 'Error: File not found',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successCount).toBe(0);
        expect(stats.failureCount).toBe(1);
      });

      it('should handle mix of successful and failed tool calls', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/valid.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
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
                  content: 'File content',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Error: File not found',
                  is_error: true,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'Written',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successCount).toBe(2);
        expect(stats.failureCount).toBe(1);
      });

      it('should treat is_error: false as success', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Bash',
                  input: { command: 'ls' },
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
                  content: 'file1.txt',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successCount).toBe(1);
        expect(stats.failureCount).toBe(0);
      });

      it('should treat missing is_error field as success', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Content',
                  // is_error field is missing
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successCount).toBe(1);
        expect(stats.failureCount).toBe(0);
      });

      it('should not count tool calls without results in success or failure', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(2);
        expect(stats.successCount).toBe(1);
        expect(stats.failureCount).toBe(0);
      });
    });

    describe('Success Rate Calculation', () => {
      it('should calculate 100% success rate when all calls succeed', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successRate).toBe(100);
      });

      it('should calculate 0% success rate when all calls fail', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
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
                  content: 'Error: File not found',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successRate).toBe(0);
      });

      it('should calculate 50% success rate correctly', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/valid.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
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
                  content: 'Content',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Error: File not found',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successRate).toBe(50);
      });

      it('should handle decimal success rates with proper rounding (66.67%)', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/file1.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Read',
                  input: { file_path: '/file2.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
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
                  content: 'Content 1',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Content 2',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'Error: File not found',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successRate).toBeCloseTo(66.67, 2);
      });

      it('should return 0% when no tool results exist', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successRate).toBe(0);
      });

      it('should calculate success rate based on tools with results only', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Read',
                  input: { file_path: '/test2.txt' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successRate).toBe(100);
      });
    });

    describe('By-Tool Breakdown', () => {
      it('should create breakdown for single tool', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool).toHaveLength(1);
        expect(stats.byTool[0]).toEqual({
          name: 'Read',
          count: 1,
          errors: 0,
        });
      });

      it('should aggregate multiple calls to the same tool', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Bash',
                  input: { command: 'ls' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Bash',
                  input: { command: 'pwd' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Bash',
                  input: { command: 'echo test' },
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
                  content: 'file1.txt',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: '/home/user',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'test',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool).toHaveLength(1);
        expect(stats.byTool[0]).toEqual({
          name: 'Bash',
          count: 3,
          errors: 0,
        });
      });

      it('should create separate entries for different tools', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Read',
                  input: { file_path: '/test2.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
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
                  content: 'Content 1',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Content 2',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'Written',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool).toHaveLength(2);
        expect(stats.byTool.find(t => t.name === 'Read')).toEqual({
          name: 'Read',
          count: 2,
          errors: 0,
        });
        expect(stats.byTool.find(t => t.name === 'Write')).toEqual({
          name: 'Write',
          count: 1,
          errors: 0,
        });
      });

      it('should count errors correctly per tool', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/valid.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Write',
                  input: { file_path: '/readonly.txt', content: 'data' },
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
                  content: 'Content',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'Error: File not found',
                  is_error: true,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'Error: Permission denied',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool.find(t => t.name === 'Read')).toEqual({
          name: 'Read',
          count: 2,
          errors: 1,
        });
        expect(stats.byTool.find(t => t.name === 'Write')).toEqual({
          name: 'Write',
          count: 1,
          errors: 1,
        });
      });

      it('should sort tools alphabetically by name', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Write',
                  input: { file_path: '/test.txt', content: 'data' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Bash',
                  input: { command: 'ls' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-3',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Written',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-2',
                  content: 'file1.txt',
                  is_error: false,
                },
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-3',
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool).toHaveLength(3);
        expect(stats.byTool[0].name).toBe('Bash');
        expect(stats.byTool[1].name).toBe('Read');
        expect(stats.byTool[2].name).toBe('Write');
      });

      it('should handle tools without results', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use',
                  id: 'tool-2',
                  name: 'Write',
                  input: { file_path: '/output.txt', content: 'data' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool).toHaveLength(2);
        expect(stats.byTool.find(t => t.name === 'Read')).toEqual({
          name: 'Read',
          count: 1,
          errors: 0,
        });
        expect(stats.byTool.find(t => t.name === 'Write')).toEqual({
          name: 'Write',
          count: 1,
          errors: 0,
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large number of tool calls', () => {
        // Arrange
        const toolUses = Array.from({ length: 100 }, (_, i) => ({
          type: 'tool_use' as const,
          id: `tool-${i}`,
          name: 'Read',
          input: { file_path: `/file${i}.txt` },
        }));

        const toolResults = Array.from({ length: 100 }, (_, i) => ({
          type: 'tool_result' as const,
          tool_use_id: `tool-${i}`,
          content: `Content ${i}`,
          is_error: false,
        }));

        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: toolUses,
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: toolResults,
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(100);
        expect(stats.successCount).toBe(100);
        expect(stats.successRate).toBe(100);
        expect(stats.byTool[0]).toEqual({
          name: 'Read',
          count: 100,
          errors: 0,
        });
      });

      it('should handle tools with special characters in names', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Custom-Tool_123',
                  input: { param: 'value' },
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
                  content: 'Result',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool[0].name).toBe('Custom-Tool_123');
      });

      it('should handle mixed user and assistant records', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'user',
            message: {
              role: 'user',
              content: [{ type: 'text', text: 'Please read the file' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:02Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.totalCalls).toBe(1);
        expect(stats.successCount).toBe(1);
      });

      it('should handle tool calls with empty input objects', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'CustomTool',
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
                  content: 'Result',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.byTool[0].name).toBe('CustomTool');
        expect(stats.byTool[0].count).toBe(1);
      });

      it('should handle tool_result with empty content', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Write',
                  input: { file_path: '/test.txt', content: 'data' },
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
                  content: '',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats.successCount).toBe(1);
      });
    });

    describe('Interface Compliance', () => {
      it('should return object matching TranscriptStats interface', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        expect(stats).toHaveProperty('totalCalls');
        expect(stats).toHaveProperty('successCount');
        expect(stats).toHaveProperty('failureCount');
        expect(stats).toHaveProperty('successRate');
        expect(stats).toHaveProperty('byTool');
        expect(typeof stats.totalCalls).toBe('number');
        expect(typeof stats.successCount).toBe('number');
        expect(typeof stats.failureCount).toBe('number');
        expect(typeof stats.successRate).toBe('number');
        expect(Array.isArray(stats.byTool)).toBe(true);
      });

      it('should return byTool array with correct structure', () => {
        // Arrange
        const records: TranscriptRecord[] = [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
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
                  content: 'Content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ];

        // Act
        const stats = calculateTranscriptStats(records);

        // Assert
        stats.byTool.forEach(tool => {
          expect(tool).toHaveProperty('name');
          expect(tool).toHaveProperty('count');
          expect(tool).toHaveProperty('errors');
          expect(typeof tool.name).toBe('string');
          expect(typeof tool.count).toBe('number');
          expect(typeof tool.errors).toBe('number');
        });
      });
    });
  });
});
