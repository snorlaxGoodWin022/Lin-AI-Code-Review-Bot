import { chunkDiff, shouldChunkFile } from '../../src/analyzer/chunker.js';

describe('chunker', () => {
  describe('chunkDiff', () => {
    test('should return single chunk for small diff', () => {
      const diffText = 'const a = 1;';
      const chunks = chunkDiff(diffText);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('const a = 1;');
    });

    test('should split large diff into chunks', () => {
      const lines = Array(1000).fill('const a = 1;'.padEnd(100, ' '));
      const diffText = lines.join('\n');

      const chunks = chunkDiff(diffText, 5000);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(5000 + 100); // 允许一行超出
      });
    });

    test('should preserve line boundaries', () => {
      const lines = Array(100).fill('const a = 1;');
      const diffText = lines.join('\n');

      const chunks = chunkDiff(diffText, 500);

      // 所有块合并后应该等于原始文本
      const reconstructed = chunks.join('\n');
      expect(reconstructed.split('\n').length).toBe(lines.length);
    });

    test('should handle empty diff', () => {
      const chunks = chunkDiff('');
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('');
    });
  });

  describe('shouldChunkFile', () => {
    test('should return false for small file', () => {
      const file = {
        chunks: [
          {
            changes: [{ content: 'const a = 1;' }],
          },
        ],
      };
      expect(shouldChunkFile(file)).toBe(false);
    });

    test('should return true for large file', () => {
      const largeContent = 'x'.repeat(20000);
      const file = {
        chunks: [
          {
            changes: [{ content: largeContent }],
          },
        ],
      };
      expect(shouldChunkFile(file)).toBe(true);
    });
  });
});
