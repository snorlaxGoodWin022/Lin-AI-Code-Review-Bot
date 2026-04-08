import { parseDiffContent, getFileName, getFileDiffText } from '../../src/analyzer/diff-parser.js';

describe('diff-parser', () => {
  describe('parseDiffContent', () => {
    test('should parse a simple diff', () => {
      const diffText = `diff --git a/test.js b/test.js
index 1234567..abcdefg 100644
--- a/test.js
+++ b/test.js
@@ -1,5 +1,6 @@
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
 const d = 5;`;

      const files = parseDiffContent(diffText);

      expect(files).toHaveLength(1);
      // parse-diff 返回不带 a/ b/ 前缀的文件名
      expect(files[0].from).toBe('test.js');
      expect(files[0].to).toBe('test.js');
      expect(files[0].chunks).toHaveLength(1);
      expect(files[0].additions).toBe(2);
      expect(files[0].deletions).toBe(1);
    });

    test('should parse multiple files', () => {
      const diffText = `diff --git a/file1.js b/file1.js
--- a/file1.js
+++ b/file1.js
@@ -1 +1 @@
-a
+b
diff --git a/file2.js b/file2.js
--- a/file2.js
+++ b/file2.js
@@ -1 +1 @@
-c
+d`;

      const files = parseDiffContent(diffText);

      expect(files).toHaveLength(2);
    });

    test('should handle empty diff', () => {
      const files = parseDiffContent('');
      expect(files).toHaveLength(0);
    });

    test('should parse changes correctly', () => {
      const diffText = `diff --git a/test.js b/test.js
--- a/test.js
+++ b/test.js
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
 const c = 4;`;

      const files = parseDiffContent(diffText);
      const changes = files[0].chunks[0].changes;

      expect(changes.length).toBeGreaterThanOrEqual(3);
      // 检查包含删除和添加的变更
      const delChanges = changes.filter(c => c.type === 'del');
      const addChanges = changes.filter(c => c.type === 'add');
      expect(delChanges.length).toBeGreaterThanOrEqual(1);
      expect(addChanges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getFileName', () => {
    test('should return "to" file name', () => {
      const file = { from: 'old.js', to: 'new.js' };
      expect(getFileName(file)).toBe('new.js');
    });

    test('should return "from" file name when "to" is /dev/null', () => {
      const file = { from: 'deleted.js', to: '/dev/null' };
      expect(getFileName(file)).toBe('deleted.js');
    });

    test('should return "unknown" for empty file', () => {
      const file = {};
      expect(getFileName(file)).toBe('unknown');
    });
  });

  describe('getFileDiffText', () => {
    test('should reconstruct diff text', () => {
      const file = {
        from: 'test.js',
        to: 'test.js',
        chunks: [
          {
            content: '@@ -1,3 +1,3 @@',
            changes: [
              { content: ' const a = 1;' },
              { content: '-const b = 2;' },
              { content: '+const b = 3;' },
            ],
          },
        ],
      };

      const diffText = getFileDiffText(file);

      expect(diffText).toContain('--- test.js');
      expect(diffText).toContain('+++ test.js');
      expect(diffText).toContain('-const b = 2;');
      expect(diffText).toContain('+const b = 3;');
    });
  });
});
