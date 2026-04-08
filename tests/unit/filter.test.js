import { shouldReviewFile, filterFiles } from '../../src/analyzer/filter.js';

describe('filter', () => {
  describe('shouldReviewFile', () => {
    test('should review normal JavaScript file', () => {
      const file = {
        to: 'src/index.js',
        from: 'src/index.js',
        chunks: [{ changes: [{ type: 'add', content: '+const a = 1;' }] }],
      };
      expect(shouldReviewFile(file)).toBe(true);
    });

    test('should ignore minified files', () => {
      const file = {
        to: 'dist/bundle.min.js',
        chunks: [{ changes: [{ type: 'add' }] }],
      };
      expect(shouldReviewFile(file)).toBe(false);
    });

    test('should ignore lock files', () => {
      const file = {
        to: 'package-lock.json',
        chunks: [{ changes: [{ type: 'add' }] }],
      };
      expect(shouldReviewFile(file)).toBe(false);
    });

    test('should ignore node_modules', () => {
      const file = {
        to: 'node_modules/some-package/index.js',
        chunks: [{ changes: [{ type: 'add' }] }],
      };
      expect(shouldReviewFile(file)).toBe(false);
    });

    test('should ignore image files', () => {
      const file = {
        to: 'assets/logo.png',
        chunks: [{ changes: [{ type: 'add' }] }],
      };
      expect(shouldReviewFile(file)).toBe(false);
    });

    test('should ignore deleted files', () => {
      const file = {
        to: '/dev/null',
        from: 'src/deleted.js',
      };
      expect(shouldReviewFile(file)).toBe(false);
    });

    test('should apply custom ignore patterns', () => {
      const file = {
        to: 'generated/api.ts',
        chunks: [{ changes: [{ type: 'add' }] }],
      };
      expect(shouldReviewFile(file, [/generated/])).toBe(false);
    });

    test('should ignore files without code changes', () => {
      const file = {
        to: 'src/index.js',
        chunks: [{ changes: [{ type: 'normal' }] }],
      };
      expect(shouldReviewFile(file)).toBe(false);
    });
  });

  describe('filterFiles', () => {
    test('should filter multiple files', () => {
      const files = [
        { to: 'src/index.js', chunks: [{ changes: [{ type: 'add' }] }] },
        { to: 'dist/bundle.min.js', chunks: [{ changes: [{ type: 'add' }] }] },
        { to: 'package-lock.json', chunks: [{ changes: [{ type: 'add' }] }] },
        { to: 'src/utils.js', chunks: [{ changes: [{ type: 'add' }] }] },
      ];

      const filtered = filterFiles(files);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].to).toBe('src/index.js');
      expect(filtered[1].to).toBe('src/utils.js');
    });

    test('should return empty array when all files are ignored', () => {
      const files = [
        { to: 'dist/bundle.min.js', chunks: [{ changes: [{ type: 'add' }] }] },
        { to: 'package-lock.json', chunks: [{ changes: [{ type: 'add' }] }] },
      ];

      const filtered = filterFiles(files);

      expect(filtered).toHaveLength(0);
    });
  });
});
