import { parseJsonl } from '../../src/utils/jsonlParser';

describe('JSONL Parser', () => {
  describe('Valid Input', () => {
    it('should parse valid JSONL content', () => {
      // Arrange
      const content = '{"a":1}\n{"b":2}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should parse single line JSONL', () => {
      // Arrange
      const content = '{"key":"value"}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ key: 'value' }]);
    });

    it('should parse complex nested objects', () => {
      // Arrange
      const content = '{"nested":{"key":"value","array":[1,2,3]}}\n{"simple":"test"}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ nested: { key: 'value', array: [1, 2, 3] } });
      expect(result[1]).toEqual({ simple: 'test' });
    });
  });

  describe('Empty Input', () => {
    it('should return empty array for empty string', () => {
      // Arrange
      const content = '';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only content', () => {
      // Arrange
      const content = '   ';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array for tabs-only content', () => {
      // Arrange
      const content = '\t\t\t';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array for newlines-only content', () => {
      // Arrange
      const content = '\n\n\n';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Empty Lines Handling', () => {
    it('should skip empty lines', () => {
      // Arrange
      const content = '{"a":1}\n\n{"b":2}\n';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should skip multiple consecutive empty lines', () => {
      // Arrange
      const content = '{"a":1}\n\n\n\n{"b":2}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should skip lines with only whitespace', () => {
      // Arrange
      const content = '{"a":1}\n   \n\t\t\n{"b":2}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should handle trailing newlines', () => {
      // Arrange
      const content = '{"a":1}\n{"b":2}\n\n\n';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });
  });

  describe('Malformed JSON Handling', () => {
    it('should skip malformed JSON lines', () => {
      // Arrange
      const content = '{"valid":1}\ninvalid json\n{"also":2}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ valid: 1 }, { also: 2 }]);
    });

    it('should handle lines with unclosed braces', () => {
      // Arrange
      const content = '{"valid":1}\n{"unclosed":true\n{"also":2}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ valid: 1 }, { also: 2 }]);
    });

    it('should handle lines with invalid JSON syntax', () => {
      // Arrange
      const content = '{"valid":1}\n{bad: "syntax"}\n{"also":2}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ valid: 1 }, { also: 2 }]);
    });

    it('should skip all lines if all are malformed', () => {
      // Arrange
      const content = 'not json\nalso not json\nstill not json';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle mixed valid and invalid lines', () => {
      // Arrange
      const content = 'invalid\n{"valid":1}\ninvalid\n{"valid":2}\ninvalid';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ valid: 1 }, { valid: 2 }]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle JSON with special characters', () => {
      // Arrange
      const content = '{"message":"Line with \\n newline"}\n{"emoji":"test"}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].message).toContain('newline');
    });

    it('should handle JSON with escaped quotes', () => {
      // Arrange
      const content = '{"text":"He said \\"hello\\""}\n{"more":"data"}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('He said "hello"');
    });

    it('should handle empty JSON objects', () => {
      // Arrange
      const content = '{}\n{"key":"value"}\n{}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{}, { key: 'value' }, {}]);
    });

    it('should handle JSON arrays', () => {
      // Arrange
      const content = '{"items":[1,2,3]}\n{"items":["a","b","c"]}';

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toEqual([{ items: [1, 2, 3] }, { items: ['a', 'b', 'c'] }]);
    });

    it('should handle very long lines', () => {
      // Arrange
      const longString = 'a'.repeat(1000);
      const content = `{"data":"${longString}"}\n{"more":"test"}`;

      // Act
      const result = parseJsonl(content);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].data).toBe(longString);
    });
  });
});
