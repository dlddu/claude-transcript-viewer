import { describe, it, expect } from 'vitest';
import { calculateTranscriptStats } from '../../src/utils/statsCalculator';
import type { TranscriptRecord } from '../../src/types';

describe('calculateTranscriptStats Utility', () => {
  describe('Empty Input', () => {
    it('should return zero stats for empty array', () => {
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

    it('should return zero stats when records have no tool_use blocks', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
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

  describe('Total Calls Counting', () => {
    it('should count single tool_use correctly', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.totalCalls).toBe(1);
    });

    it('should count multiple tool_use blocks in single message', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Bash', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.totalCalls).toBe(3);
    });

    it('should count tool_use across multiple messages', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Bash', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:02Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.totalCalls).toBe(3);
    });
  });

  describe('Success and Failure Counting', () => {
    it('should count successful tool call when is_error is false', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'Success',
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

    it('should count failed tool call when is_error is true', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'Error',
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

    it('should count both success and failures correctly', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Bash', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'OK',
                is_error: false,
              },
              {
                type: 'tool_result',
                tool_use_id: 'tool-2',
                content: 'Error',
                is_error: true,
              },
              {
                type: 'tool_result',
                tool_use_id: 'tool-3',
                content: 'OK',
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
      expect(stats.totalCalls).toBe(3);
    });

    it('should treat missing is_error as success', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'OK',
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

    it('should handle tool_use without matching tool_result', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'OK',
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
    it('should return 100 when all calls succeed', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-2', content: 'OK', is_error: false },
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

    it('should return 0 when all calls fail', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'Error', is_error: true },
              { type: 'tool_result', tool_use_id: 'tool-2', content: 'Error', is_error: true },
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

    it('should return 50 when half succeed', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-2', content: 'Error', is_error: true },
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

    it('should round success rate to 2 decimal places', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Bash', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-2', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-3', content: 'Error', is_error: true },
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

    it('should return 0 when no tool results exist', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
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
  });

  describe('Tool Breakdown', () => {
    it('should create breakdown entry for single tool', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
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

    it('should aggregate counts for same tool name', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.byTool).toHaveLength(2);

      const readStats = stats.byTool.find((t) => t.name === 'Read');
      expect(readStats?.count).toBe(2);

      const writeStats = stats.byTool.find((t) => t.name === 'Write');
      expect(writeStats?.count).toBe(1);
    });

    it('should count errors per tool correctly', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-2', content: 'Error', is_error: true },
              { type: 'tool_result', tool_use_id: 'tool-3', content: 'Error', is_error: true },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      const readStats = stats.byTool.find((t) => t.name === 'Read');
      expect(readStats?.errors).toBe(1);

      const writeStats = stats.byTool.find((t) => t.name === 'Write');
      expect(writeStats?.errors).toBe(1);
    });

    it('should show 0 errors for tools that never failed', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-2', content: 'OK', is_error: false },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      const readStats = stats.byTool.find((t) => t.name === 'Read');
      expect(readStats?.errors).toBe(0);

      const writeStats = stats.byTool.find((t) => t.name === 'Write');
      expect(writeStats?.errors).toBe(0);
    });

    it('should sort tools alphabetically by name', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Write', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Bash', input: {} },
              { type: 'tool_use', id: 'tool-3', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-4', name: 'Edit', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      const toolNames = stats.byTool.map((t) => t.name);
      expect(toolNames).toEqual(['Bash', 'Edit', 'Read', 'Write']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large number of tool calls', () => {
      // Arrange
      const toolUses = Array.from({ length: 1000 }, (_, i) => ({
        type: 'tool_use' as const,
        id: `tool-${i}`,
        name: `Tool${i % 10}`,
        input: {},
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
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.totalCalls).toBe(1000);
      expect(stats.byTool).toHaveLength(10);
    });

    it('should handle tools with special characters in name', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Tool-Name_123', input: {} },
              { type: 'tool_use', id: 'tool-2', name: 'Tool@#$%', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.byTool).toHaveLength(2);
      expect(stats.byTool[0].name).toBe('Tool-Name_123');
      expect(stats.byTool[1].name).toBe('Tool@#$%');
    });

    it('should handle mixed content blocks', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Let me check' },
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'text', text: 'And write' },
              { type: 'tool_use', id: 'tool-2', name: 'Write', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.totalCalls).toBe(2);
      expect(stats.byTool).toHaveLength(2);
    });

    it('should handle tool_result blocks without matching tool_use', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
              { type: 'tool_result', tool_use_id: 'tool-99', content: 'Orphan', is_error: false },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.totalCalls).toBe(1);
      expect(stats.successCount).toBe(1);
    });
  });

  describe('Return Type', () => {
    it('should return object with all required fields', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats).toHaveProperty('totalCalls');
      expect(stats).toHaveProperty('successCount');
      expect(stats).toHaveProperty('failureCount');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('byTool');
    });

    it('should return byTool array with correct structure', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const stats = calculateTranscriptStats(records);

      // Assert
      expect(stats.byTool[0]).toHaveProperty('name');
      expect(stats.byTool[0]).toHaveProperty('count');
      expect(stats.byTool[0]).toHaveProperty('errors');
    });
  });
});
