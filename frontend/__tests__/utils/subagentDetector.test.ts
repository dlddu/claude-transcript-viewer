import { describe, it, expect } from 'vitest';
import { isSubagentCall, extractAgentId } from '../../src/utils/subagentDetector';
import type { ToolUseBlock, ToolResultBlock } from '../../src/types';

describe('Subagent Detector Utility', () => {
  describe('isSubagentCall function', () => {
    describe('happy path - Task tool detection', () => {
      it('should return true when tool name is Task', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-1',
          name: 'Task',
          input: {
            description: 'Analyze codebase',
            task: 'codebase-analyzer',
          },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(true);
      });

      it('should return true for Task tool with complex input', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-subagent-123',
          name: 'Task',
          input: {
            description: 'Explore the codebase to find configuration files',
            task: 'Explore',
            params: {
              directory: '/src',
              pattern: '*.config.ts',
            },
          },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(true);
      });

      it('should return true for Task tool with empty input', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-empty',
          name: 'Task',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('non-Task tools', () => {
      it('should return false when tool name is not Task', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-2',
          name: 'Read',
          input: { path: '/file.txt' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for Read tool', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-read',
          name: 'Read',
          input: { file_path: '/test.ts' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for Write tool', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-write',
          name: 'Write',
          input: { file_path: '/test.ts', content: 'test' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for Edit tool', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-edit',
          name: 'Edit',
          input: { file_path: '/test.ts', old_string: 'old', new_string: 'new' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for Bash tool', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-bash',
          name: 'Bash',
          input: { command: 'ls -la' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for Grep tool', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-grep',
          name: 'Grep',
          input: { pattern: 'TODO' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for Glob tool', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-glob',
          name: 'Glob',
          input: { pattern: '**/*.ts' },
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('edge cases - case sensitivity', () => {
      it('should return false for lowercase "task"', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-lowercase',
          name: 'task',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for uppercase "TASK"', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-uppercase',
          name: 'TASK',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for mixed case "TaSk"', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-mixed',
          name: 'TaSk',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('edge cases - similar names', () => {
      it('should return false for "TaskRunner"', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-runner',
          name: 'TaskRunner',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for "SubTask"', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-subtask',
          name: 'SubTask',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for empty string name', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-empty-name',
          name: '',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for name with whitespace "Task "', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-whitespace',
          name: 'Task ',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for name with whitespace " Task"', () => {
        // Arrange
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: 'tool-leading',
          name: ' Task',
          input: {},
        };

        // Act
        const result = isSubagentCall(toolUse);

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('extractAgentId function', () => {
    describe('happy path - successful extraction', () => {
      it('should extract agentId from valid JSON content', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-1',
          content: JSON.stringify({
            agentId: 'agent-codebase-analyzer-123',
            status: 'completed',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('agent-codebase-analyzer-123');
      });

      it('should extract agentId from minimal JSON content', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-2',
          content: JSON.stringify({
            agentId: 'agent-explore-456',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('agent-explore-456');
      });

      it('should extract agentId from complex nested JSON', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-3',
          content: JSON.stringify({
            agentId: 'agent-plan-789',
            metadata: {
              timestamp: '2024-01-29T10:00:00Z',
              nested: {
                field: 'value',
              },
            },
            results: ['item1', 'item2'],
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('agent-plan-789');
      });

      it('should handle agentId with special characters', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-4',
          content: JSON.stringify({
            agentId: 'agent-test-writer_v1.2.3-beta',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('agent-test-writer_v1.2.3-beta');
      });

      it('should handle agentId with UUID format', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-5',
          content: JSON.stringify({
            agentId: 'agent-550e8400-e29b-41d4-a716-446655440000',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('agent-550e8400-e29b-41d4-a716-446655440000');
      });

      it('should extract numeric agentId', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-6',
          content: JSON.stringify({
            agentId: '12345',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('12345');
      });
    });

    describe('missing agentId', () => {
      it('should return null when agentId field is missing', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-no-id',
          content: JSON.stringify({
            status: 'completed',
            message: 'Task finished',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when JSON is empty object', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-empty',
          content: JSON.stringify({}),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when agentId is null', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-null-id',
          content: JSON.stringify({
            agentId: null,
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when agentId is undefined', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-undefined',
          content: JSON.stringify({
            agentId: undefined,
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('invalid content', () => {
      it('should return null for invalid JSON', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-invalid',
          content: 'not a valid json',
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for malformed JSON', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-malformed',
          content: '{"agentId": "agent-123"',
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for empty string content', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-empty-content',
          content: '',
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for plain text content', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-text',
          content: 'Task completed successfully',
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for JSON array', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-array',
          content: JSON.stringify(['agent-1', 'agent-2']),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for JSON primitive', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-primitive',
          content: JSON.stringify('just-a-string'),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('edge cases - agentId types', () => {
      it('should return null when agentId is a number', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-number',
          content: JSON.stringify({
            agentId: 12345,
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when agentId is a boolean', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-boolean',
          content: JSON.stringify({
            agentId: true,
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when agentId is an object', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-object',
          content: JSON.stringify({
            agentId: { id: 'agent-123' },
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when agentId is an array', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-array-id',
          content: JSON.stringify({
            agentId: ['agent-1', 'agent-2'],
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle empty string agentId', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-empty-string',
          content: JSON.stringify({
            agentId: '',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('');
      });

      it('should handle whitespace-only agentId', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-whitespace',
          content: JSON.stringify({
            agentId: '   ',
          }),
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('   ');
      });
    });

    describe('error handling', () => {
      it('should return null when content has is_error flag', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-error',
          content: JSON.stringify({
            error: 'Task failed',
            message: 'Something went wrong',
          }),
          is_error: true,
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBeNull();
      });

      it('should extract agentId even when is_error is false', () => {
        // Arrange
        const toolResult: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: 'tool-success',
          content: JSON.stringify({
            agentId: 'agent-success-123',
          }),
          is_error: false,
        };

        // Act
        const result = extractAgentId(toolResult);

        // Assert
        expect(result).toBe('agent-success-123');
      });
    });
  });
});
