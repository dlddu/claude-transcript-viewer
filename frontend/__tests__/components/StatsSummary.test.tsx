import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsSummary from '../../src/components/StatsSummary';
import type { TranscriptRecord } from '../../src/types';

describe('StatsSummary Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with empty records array', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/total calls/i)).toBeInTheDocument();
    });

    it('should have proper structure with cards and table', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      const cards = container.querySelectorAll('.bg-white, .shadow, .rounded');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State - No Tool Calls', () => {
    it('should display zero total calls when records array is empty', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display N/A or 0% success rate when no tool calls exist', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      const successRateText = screen.queryByText(/N\/A|0%/i);
      expect(successRateText).toBeInTheDocument();
    });

    it('should show empty table or "No tool calls" message when records is empty', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      const emptyMessage = screen.queryByText(/no tool calls|no data/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display zero total calls when records have no tool_use blocks', () => {
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
            content: [{ type: 'text', text: 'Hi there!' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Total Tool Calls Count', () => {
    it('should count single tool call correctly', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Let me read that file' },
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
          type: 'user',
          message: {
            role: 'user',
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
      expect(screen.getByTestId('total-calls')).toHaveTextContent('1');
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
                type: 'tool_use',
                id: 'tool-2',
                name: 'Write',
                input: { file_path: '/test2.txt' },
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
                type: 'tool_use',
                id: 'tool-3',
                name: 'Bash',
                input: { command: 'ls' },
              },
            ],
          },
          timestamp: '2024-01-29T10:00:04Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should count tool calls from multiple assistant messages', () => {
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
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-3', name: 'Bash', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Success and Failure Count', () => {
    it('should count successful tool calls when is_error is false', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByTestId('success-count')).toHaveTextContent('1');
    });

    it('should count failed tool calls when is_error is true', () => {
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
                content: 'File not found',
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
      expect(screen.getByTestId('failure-count')).toHaveTextContent('1');
    });

    it('should count both success and failure correctly', () => {
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
                content: 'Success',
                is_error: false,
              },
              {
                type: 'tool_result',
                tool_use_id: 'tool-2',
                content: 'Failed',
                is_error: true,
              },
              {
                type: 'tool_result',
                tool_use_id: 'tool-3',
                content: 'Success',
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
      expect(screen.getByTestId('success-count')).toHaveTextContent('2');
      expect(screen.getByTestId('failure-count')).toHaveTextContent('1');
    });

    it('should handle tool calls without matching tool_result as pending or unknown', () => {
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
                content: 'Success',
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
      expect(screen.getByTestId('total-calls')).toHaveTextContent('2');
      expect(screen.getByTestId('success-count')).toHaveTextContent('1');
    });
  });

  describe('Success Rate Calculation', () => {
    it('should display 100% success rate when all calls succeed', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should display 0% success rate when all calls fail', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('should display 50% success rate when half succeed', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should display rounded percentage for partial success rates', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/66\.?67?%|67%/)).toBeInTheDocument();
    });
  });

  describe('Tool Breakdown Table', () => {
    it('should display table header with Tool Name, Calls, Errors columns', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: {} }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/tool.*name/i)).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /calls/i })).toBeInTheDocument();
      expect(screen.getByText(/errors/i)).toBeInTheDocument();
    });

    it('should list each unique tool name in the table', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
      expect(screen.getByText('Bash')).toBeInTheDocument();
    });

    it('should display correct call count for each tool', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const readRow = screen.getByText('Read').closest('tr');
      expect(readRow).toHaveTextContent('2');

      const writeRow = screen.getByText('Write').closest('tr');
      expect(writeRow).toHaveTextContent('1');
    });

    it('should display correct error count for each tool', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      const readRow = screen.getByText('Read').closest('tr');
      expect(readRow?.textContent).toMatch(/1/);

      const writeRow = screen.getByText('Write').closest('tr');
      expect(writeRow?.textContent).toMatch(/1/);
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
      render(<StatsSummary records={records} />);

      // Assert
      const readRow = screen.getByText('Read').closest('tr');
      expect(readRow?.textContent).toMatch(/0/);

      const writeRow = screen.getByText('Write').closest('tr');
      expect(writeRow?.textContent).toMatch(/0/);
    });

    it('should sort tools by name alphabetically', () => {
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
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      const rows = screen.getAllByRole('row');
      const toolNames = rows
        .slice(1)
        .map((row) => (row as HTMLTableRowElement).cells[0]?.textContent || '')
        .filter(Boolean);

      expect(toolNames).toEqual(['Bash', 'Read', 'Write']);
    });
  });

  describe('Card Layout and Styling', () => {
    it('should display total calls in a card with proper styling', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      const cards = container.querySelectorAll('.bg-white');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display success rate in a separate card', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: {} }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK', is_error: false },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText(/success.*rate/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should use Tailwind CSS classes for styling', () => {
      // Arrange
      const records: TranscriptRecord[] = [];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      const styledElements = container.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"]');
      expect(styledElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tool_result with missing is_error field', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: {} }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'tool-1', content: 'OK' },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByTestId('total-calls')).toHaveTextContent('1');
    });

    it('should handle very large number of tool calls', () => {
      // Arrange
      const toolUses = Array.from({ length: 100 }, (_, i) => ({
        type: 'tool_use' as const,
        id: `tool-${i}`,
        name: `Tool${i % 5}`,
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('100')).toBeInTheDocument();
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
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('Tool-Name_123')).toBeInTheDocument();
    });

    it('should handle mixed content with text and tool blocks', () => {
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
      render(<StatsSummary records={records} />);

      // Assert
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
    });

    it('should handle duplicate tool_use IDs gracefully', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
              { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
    });
  });

  describe('Component Props', () => {
    it('should accept TranscriptRecord array as records prop', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: {} }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      // Act
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
    });

    it('should update display when records prop changes', () => {
      // Arrange
      const initialRecords: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: {} }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      const updatedRecords: TranscriptRecord[] = [
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
      ];

      // Act
      const { rerender } = render(<StatsSummary records={initialRecords} />);
      expect(screen.getByTestId('total-calls')).toHaveTextContent('1');

      rerender(<StatsSummary records={updatedRecords} />);

      // Assert
      expect(screen.getByTestId('total-calls')).toHaveTextContent('2');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should compile without type errors for valid TranscriptRecord array', () => {
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
      const { container } = render(<StatsSummary records={records} />);

      // Assert
      expect(container).toBeTruthy();
    });
  });
});
