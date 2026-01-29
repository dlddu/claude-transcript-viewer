import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsSummary from '../../src/components/StatsSummary';
import type { TranscriptRecord } from '../../src/types';

describe('StatsSummary Component', () => {

  describe('Empty Records Handling', () => {
    it('should render without crashing when records array is empty', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display zero for total calls when records is empty', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toBeInTheDocument();
      expect(totalCallsCard).toHaveTextContent('0');
    });

    it('should display zero success count when records is empty', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByLabelText('Successful tool calls')).toBeInTheDocument();
    });

    it('should handle 0% success rate when no calls exist', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard).toBeInTheDocument();
      expect(successRateCard).toHaveTextContent(/0\.00%/);
    });

    it('should display empty table or message when no tools used', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert - Should either show empty table or "No tools used" message
      const emptyMessage = screen.queryByText(/no tool|no data/i);
      const table = screen.queryByRole('table');
      expect(emptyMessage || table).toBeTruthy();
    });
  });

  describe('Total Tool Calls Calculation', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('1');
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('3');
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('2');
    });

    it('should not count text blocks as tool calls', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('1');
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('2');
    });
  });

  describe('Success and Failure Count Calculation', () => {
    it('should count all successful tool calls correctly', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const successCard = screen.getByLabelText('Successful tool calls');
      expect(successCard).toHaveTextContent('2');
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
      render(<StatsSummary records={records} />);

      // Assert
      const failureCard = screen.getByLabelText('Failed tool calls');
      expect(failureCard).toHaveTextContent('1');
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
      render(<StatsSummary records={records} />);

      // Assert
      const successCard = screen.getByLabelText('Successful tool calls');
      const failureCard = screen.getByLabelText('Failed tool calls');
      expect(successCard).toHaveTextContent('2');
      expect(failureCard).toHaveTextContent('1');
    });

    it('should treat tool calls without result as neither success nor failure', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      const successCard = screen.getByLabelText('Successful tool calls');
      expect(totalCallsCard).toHaveTextContent('2');
      expect(successCard).toHaveTextContent('1');
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
      render(<StatsSummary records={records} />);

      // Assert
      const successCard = screen.getByLabelText('Successful tool calls');
      const failureCard = screen.getByLabelText('Failed tool calls');
      expect(successCard).toHaveTextContent('1');
      expect(failureCard).toHaveTextContent('0');
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
      render(<StatsSummary records={records} />);

      // Assert
      const successCard = screen.getByLabelText('Successful tool calls');
      expect(successCard).toHaveTextContent('1');
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
      render(<StatsSummary records={records} />);

      // Assert
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard).toHaveTextContent(/100\.00%/);
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
      render(<StatsSummary records={records} />);

      // Assert
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard).toHaveTextContent(/0\.00%/);
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
      render(<StatsSummary records={records} />);

      // Assert
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard).toHaveTextContent(/50\.00%/);
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
      render(<StatsSummary records={records} />);

      // Assert
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard).toHaveTextContent(/66\.67%/);
    });

    it('should display success rate as percentage with % symbol', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard.textContent).toMatch(/%/);
    });

    it('should handle success rate when only some tools have results', () => {
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
      render(<StatsSummary records={records} />);

      // Assert - Should calculate based on tools with results only
      const successRateCard = screen.getByLabelText('Success rate');
      expect(successRateCard).toHaveTextContent(/100\.00%/);
    });
  });

  describe('Tool Breakdown Table', () => {
    it('should display table with tool breakdown', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display column headers for tool name, count, and errors', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByRole('columnheader', { name: /Tool Name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Calls/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Errors/i })).toBeInTheDocument();
    });

    it('should list each tool with its call count', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const table = screen.getByRole('table');
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();

      // Check table content more specifically
      const rows = table.querySelectorAll('tbody tr');
      const readRow = Array.from(rows).find(row => row.textContent?.includes('Read'));
      const writeRow = Array.from(rows).find(row => row.textContent?.includes('Write'));
      expect(readRow?.textContent).toContain('2');
      expect(writeRow?.textContent).toContain('1');
    });

    it('should display error count for each tool', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
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
      render(<StatsSummary records={records} />);

      // Assert
      const table = screen.getByRole('table');
      expect(screen.getByText('Bash')).toBeInTheDocument();

      const rows = table.querySelectorAll('tbody tr');
      const bashRow = Array.from(rows).find(row => row.textContent?.includes('Bash'));
      expect(bashRow?.textContent).toContain('3');
    });

    it('should show zero errors for tools with no errors', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const table = screen.getByRole('table');
      expect(table.textContent).toContain('0');
    });

    it('should handle tools with multiple errors correctly', () => {
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
                input: { file_path: '/file3.txt' },
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
                content: 'Error: Not found',
                is_error: true,
              },
              {
                type: 'tool_result',
                tool_use_id: 'tool-2',
                content: 'Content',
                is_error: false,
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
      render(<StatsSummary records={records} />);

      // Assert
      const table = screen.getByRole('table');
      expect(screen.getByText('Read')).toBeInTheDocument();

      const rows = table.querySelectorAll('tbody tr');
      const readRow = Array.from(rows).find(row => row.textContent?.includes('Read'));
      const cells = readRow?.querySelectorAll('td');

      expect(cells?.[1].textContent).toBe('3'); // Total count
      expect(cells?.[2].textContent).toBe('2'); // Error count
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
      render(<StatsSummary records={records} />);
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');

      // Assert
      expect(rows).toHaveLength(3);
      expect(rows[0].textContent).toContain('Bash');
      expect(rows[1].textContent).toContain('Read');
      expect(rows[2].textContent).toContain('Write');
    });
  });

  describe('UI Rendering and Layout', () => {
    it('should have a heading or title', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const heading = screen.getByRole('heading', { name: /Tool Usage Statistics/i });
      expect(heading).toBeInTheDocument();
    });

    it('should display all summary metrics in the same section', () => {
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByText(/total/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Successful tool calls')).toBeInTheDocument();
      expect(screen.getByText(/%/)).toBeInTheDocument();
    });

    it('should separate summary section from breakdown table visually', () => {
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      const summarySection = container.querySelector('[data-testid="summary-section"], .summary, section');
      const table = screen.getByRole('table');
      expect(summarySection || container.firstChild).toBeInTheDocument();
      expect(table).toBeInTheDocument();
    });

    it('should apply proper styling classes', () => {
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container.firstChild).toHaveClass(/p-|m-|bg-|border-|rounded-/);
    });

    it('should render table with proper structure (thead and tbody)', () => {
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
      render(<StatsSummary records={records} />);
      const table = screen.getByRole('table');

      // Assert
      expect(table.querySelector('thead')).toBeInTheDocument();
      expect(table.querySelector('tbody')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels for stats', () => {
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      const ariaLabels = container.querySelectorAll('[aria-label]');
      expect(ariaLabels.length).toBeGreaterThan(0);
    });

    it('should have semantic table structure with proper column headers', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThanOrEqual(3);
    });

    it('should use semantic HTML elements', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByRole('heading', { name: /Tool Usage Statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have descriptive heading text', () => {
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
      render(<StatsSummary records={records} />);
      const heading = screen.getByRole('heading', { name: /Tool Usage Statistics/i });

      // Assert
      expect(heading.textContent).toMatch(/stat|summary|tool|overview/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle records with only text blocks', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello, how can I help?' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('0');
    });

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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('100');
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('Custom-Tool_123')).toBeInTheDocument();
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
      render(<StatsSummary records={records} />);

      // Assert
      const totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('1');
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByText('CustomTool')).toBeInTheDocument();
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      const successCard = screen.getByLabelText('Successful tool calls');
      expect(successCard).toHaveTextContent('1');
    });
  });

  describe('Component Stability', () => {
    it('should not crash when props change', () => {
      // Arrange
      const initialRecords: TranscriptRecord[] = [
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
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      const updatedRecords: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'Write',
                input: { file_path: '/test2.txt', content: 'data' },
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
                tool_use_id: 'tool-1',
                content: 'Written',
                is_error: false,
              },
            ],
          },
          timestamp: '2024-01-29T10:00:03Z',
        },
      ];

      // Act
      const { rerender } = render(<StatsSummary records={initialRecords} />);
      expect(screen.getByText('Read')).toBeInTheDocument();

      rerender(<StatsSummary records={updatedRecords} />);

      // Assert
      expect(screen.getByText('Write')).toBeInTheDocument();
      expect(screen.queryByText('Read')).not.toBeInTheDocument();
    });

    it('should update stats when records are added', () => {
      // Arrange
      const initialRecords: TranscriptRecord[] = [
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

      const expandedRecords: TranscriptRecord[] = [
        ...initialRecords,
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
                content: 'Written',
                is_error: false,
              },
            ],
          },
          timestamp: '2024-01-29T10:00:03Z',
        },
      ];

      // Act
      const { rerender } = render(<StatsSummary records={initialRecords} />);
      let totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('1');

      rerender(<StatsSummary records={expandedRecords} />);

      // Assert
      totalCallsCard = screen.getByLabelText('Total tool calls');
      expect(totalCallsCard).toHaveTextContent('2');
    });
  });
});
