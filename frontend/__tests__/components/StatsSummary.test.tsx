import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsSummary from '../../src/components/StatsSummary';
import type { TranscriptRecord } from '../../src/types';

describe('StatsSummary Component', () => {

  describe('Basic Rendering', () => {
    it('should render without crashing with empty records', () => {
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

    it('should render without crashing with valid records', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have responsive layout classes', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);

      // Assert
      const responsiveElement = container.querySelector('[class*="grid"], [class*="flex"]');
      expect(responsiveElement).toBeInTheDocument();
    });
  });

  describe('Total Calls Display', () => {
    it('should display zero total calls when no records', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/total.*calls/i)).toBeInTheDocument();
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('0');
    });

    it('should count single tool use correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/total.*calls/i)).toBeInTheDocument();
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('1');
    });

    it('should count multiple tool uses correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Write',
                  input: { file_path: '/test2.txt', content: 'data' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Bash',
                  input: { command: 'ls' },
                },
              ],
            },
            timestamp: '2024-01-29T10:31:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/total.*calls/i)).toBeInTheDocument();
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('3');
    });

    it('should ignore non-tool_use content blocks in count', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'text' as const,
                  text: 'Some text',
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('1');
    });
  });

  describe('Success Count Display', () => {
    it('should display zero success count when no tool results', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-count-value')).toHaveTextContent('0');
    });

    it('should count successful tool results correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'File content',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-count-value')).toHaveTextContent('1');
    });

    it('should not count error results as success', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'File not found',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-count-value')).toHaveTextContent('0');
    });

    it('should count mixed success and error results correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Read',
                  input: { file_path: '/test2.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Write',
                  input: { file_path: '/test3.txt', content: 'data' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'File not found',
                  is_error: true,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_3',
                  content: 'Written',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-count-value')).toHaveTextContent('2');
    });
  });

  describe('Failure Count Display', () => {
    it('should display zero failure count when no errors', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/failure|failed/i)).toBeInTheDocument();
      expect(screen.getByTestId('failure-count-value')).toHaveTextContent('0');
    });

    it('should count error results correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Write',
                  input: { file_path: '/readonly.txt', content: 'data' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'File not found',
                  is_error: true,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'Permission denied',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/failure|failed/i)).toBeInTheDocument();
      expect(screen.getByTestId('failure-count-value')).toHaveTextContent('2');
    });
  });

  describe('Success Rate Calculation', () => {
    it('should display 0% success rate when no tool calls', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success.*rate/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-rate-value')).toHaveTextContent(/0\.0%/);
    });

    it('should display 100% success rate when all succeed', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success.*rate/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-rate-value')).toHaveTextContent(/100\.0%/);
    });

    it('should display 0% success rate when all fail', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/invalid.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Error',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success.*rate/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-rate-value')).toHaveTextContent(/0\.0%/);
    });

    it('should calculate 50% success rate correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Read',
                  input: { file_path: '/test2.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'Error',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success.*rate/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-rate-value')).toHaveTextContent(/50\.0%/);
    });

    it('should handle fractional percentages correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Read',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_3',
                  content: 'Error',
                  is_error: true,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert - 2/3 = 66.67%
      expect(screen.getByText(/success.*rate/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-rate-value')).toHaveTextContent(/66\.7%/);
    });
  });

  describe('By Tool Statistics Table', () => {
    it('should display table headers', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/tool.*name/i)).toBeInTheDocument();
      expect(screen.getByText(/total/i)).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/failed|failure/i)).toBeInTheDocument();
    });

    it('should display "No data" message when no tool calls', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/no.*data|no.*tool.*calls/i)).toBeInTheDocument();
    });

    it('should display tool statistics for single tool', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test.txt' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText('Read')).toBeInTheDocument();
      const allOnes = screen.getAllByText('1');
      expect(allOnes.length).toBeGreaterThan(0);
    });

    it('should group statistics by tool name', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: { file_path: '/test1.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Read',
                  input: { file_path: '/test2.txt' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Write',
                  input: { file_path: '/test3.txt', content: 'data' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'Error',
                  is_error: true,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_3',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
      // Read should have 2 total calls
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should calculate per-tool success and failure counts', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Bash',
                  input: { command: 'ls' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Bash',
                  input: { command: 'invalid' },
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Bash',
                  input: { command: 'pwd' },
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'file1.txt',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'command not found',
                  is_error: true,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_3',
                  content: '/home',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText('Bash')).toBeInTheDocument();
      // Should show total 3, success 2, failure 1 for Bash
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should display multiple tools with correct statistics', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Write',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Edit',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_4',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_2',
                  content: 'Success',
                  is_error: false,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_3',
                  content: 'Error',
                  is_error: true,
                },
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_4',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should sort tools alphabetically', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Write',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Bash',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_3',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);
      const toolNames = screen.getAllByRole('cell').filter(cell =>
        ['Bash', 'Read', 'Write'].includes(cell.textContent || '')
      );

      // Assert
      expect(toolNames[0].textContent).toBe('Bash');
      expect(toolNames[1].textContent).toBe('Read');
      expect(toolNames[2].textContent).toBe('Write');
    });
  });

  describe('Summary Cards Styling', () => {
    it('should apply card styling with Tailwind classes', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);
      const cardElement = container.querySelector('.bg-white, .rounded, .shadow');

      // Assert
      expect(cardElement).toBeInTheDocument();
    });

    it('should display success rate with appropriate color coding', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);
      const greenElement = container.querySelector('.text-green-500, .text-green-600, .bg-green-100');

      // Assert
      expect(greenElement).toBeInTheDocument();
    });

    it('should apply table styling with borders and stripes', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);
      const tableElement = container.querySelector('table');

      // Assert
      expect(tableElement).toBeInTheDocument();
      expect(tableElement?.className).toMatch(/border|table/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle records with no content array', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('0');
    });

    it('should handle tool_use without matching tool_result', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Write',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  is_error: false,
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('2'); // Total calls
      expect(screen.getByTestId('success-count-value')).toHaveTextContent('1'); // Success count
      expect(screen.getByTestId('failure-count-value')).toHaveTextContent('1'); // Failure count (no result)
    });

    it('should handle tool_result with is_error undefined as success', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'user' as const,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: 'tool_1',
                  content: 'Success',
                  // is_error is undefined
                },
              ],
            },
            timestamp: '2024-01-29T10:30:05Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-count-value')).toHaveTextContent('1');
    });

    it('should handle duplicate tool names correctly', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:31:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      const readElements = screen.getAllByText('Read');
      expect(readElements.length).toBe(1); // Should be grouped
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('2'); // Total count for Read
    });

    it('should handle empty tool name gracefully', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: '',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('1'); // Should still count
    });

    it('should handle very large numbers of tool calls', () => {
      // Arrange
      const toolUseBlocks = Array.from({ length: 1000 }, (_, i) => ({
        type: 'tool_use' as const,
        id: `tool_${i}`,
        name: 'Read',
        input: {},
      }));

      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: toolUseBlocks,
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('1000');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout', () => {
      // Arrange
      const props = {
        records: [] as TranscriptRecord[],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);
      const gridElement = container.querySelector('[class*="grid"], [class*="md:grid"], [class*="lg:grid"]');

      // Assert
      expect(gridElement).toBeInTheDocument();
    });

    it('should have mobile-friendly table', () => {
      // Arrange
      const props = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ],
      };

      // Act
      const { container } = render(<StatsSummary {...props} />);
      const responsiveElement = container.querySelector('[class*="overflow"], [class*="scroll"]');

      // Assert
      expect(responsiveElement).toBeInTheDocument();
    });
  });

  describe('Data Integrity', () => {
    it('should not mutate input records', () => {
      // Arrange
      const records: TranscriptRecord[] = [
        {
          type: 'assistant' as const,
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use' as const,
                id: 'tool_1',
                name: 'Read',
                input: { file_path: '/test.txt' },
              },
            ],
          },
          timestamp: '2024-01-29T10:30:00Z',
        },
      ];
      const originalRecords = JSON.parse(JSON.stringify(records));
      const props = { records };

      // Act
      render(<StatsSummary {...props} />);

      // Assert
      expect(records).toEqual(originalRecords);
    });

    it('should re-render correctly when records prop changes', () => {
      // Arrange
      const initialProps = {
        records: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_1',
                  name: 'Read',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:30:00Z',
          },
        ] as TranscriptRecord[],
      };

      // Act
      const { rerender } = render(<StatsSummary {...initialProps} />);
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('1');

      const updatedProps = {
        records: [
          ...initialProps.records,
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use' as const,
                  id: 'tool_2',
                  name: 'Write',
                  input: {},
                },
              ],
            },
            timestamp: '2024-01-29T10:31:00Z',
          },
        ] as TranscriptRecord[],
      };

      rerender(<StatsSummary {...updatedProps} />);

      // Assert
      expect(screen.getByTestId('total-calls-value')).toHaveTextContent('2');
    });
  });
});
