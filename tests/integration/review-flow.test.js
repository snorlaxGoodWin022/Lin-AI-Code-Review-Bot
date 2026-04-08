import { parseDiffContent, getFileName, getFileDiffText } from '../../src/analyzer/diff-parser.js';
import { filterFiles } from '../../src/analyzer/filter.js';
import { chunkDiff } from '../../src/analyzer/chunker.js';
import { buildReviewPrompt } from '../../src/ai/prompts/review.js';
import { extractRules, checkCustomRules } from '../../src/config/rules.js';

describe('Integration: Code Review Flow', () => {
  describe('End-to-end diff processing', () => {
    test('should process a complete PR diff', () => {
      const diffText = `diff --git a/src/index.js b/src/index.js
index 1234567..abcdefg 100644
--- a/src/index.js
+++ b/src/index.js
@@ -1,5 +1,7 @@
 const express = require('express');
+const app = express();
+console.log('Starting app');
 const router = express.Router();
-debugger;
+
 router.get('/', (req, res) => {
   res.send('Hello');
diff --git a/package-lock.json b/package-lock.json
index 1111111..2222222 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1 +1 @@
-{"old": "lock"}
+{"new": "lock"}
diff --git a/dist/bundle.min.js b/dist/bundle.min.js
new file mode 100644
--- /dev/null
+++ b/dist/bundle.min.js
@@ -0,0 +1 @@
+!function(){console.log("minified")}();`;

      // Step 1: Parse diff
      const files = parseDiffContent(diffText);
      expect(files).toHaveLength(3);

      // Step 2: Filter files
      const filesToReview = filterFiles(files);
      expect(filesToReview).toHaveLength(1); // Only src/index.js
      expect(getFileName(filesToReview[0])).toBe('src/index.js');

      // Step 3: Get diff text for review
      const fileDiff = getFileDiffText(filesToReview[0]);
      expect(fileDiff).toContain('console.log');
      expect(fileDiff).toContain('debugger');

      // Step 4: Chunk if needed
      const chunks = chunkDiff(fileDiff);
      expect(chunks).toHaveLength(1);

      // Step 5: Build prompt
      const prompt = buildReviewPrompt(chunks[0], 'src/index.js');
      expect(prompt).toContain('src/index.js');
      expect(prompt).toContain('console.log');
    });

    test('should apply custom rules and detect violations', () => {
      const config = {
        rules: [
          { name: 'no-console-log', severity: 'P2', pattern: 'console\\.log', message: 'No console.log' },
          { name: 'no-debugger', severity: 'P1', pattern: 'debugger', message: 'No debugger' },
        ],
      };

      const rules = extractRules(config);
      const diffText = `+console.log('test');
-debugger;
+const a = 1;`;

      const issues = checkCustomRules('test.js', diffText, rules);

      // Only console.log should be detected (new line with +)
      expect(issues).toHaveLength(1);
      expect(issues[0].name).toBe('no-console-log');
      expect(issues[0].severity).toBe('P2');
    });
  });

  describe('Large file handling', () => {
    test('should chunk large diffs appropriately', () => {
      const largeContent = Array(500).fill('const x = "a very long string that adds characters";').join('\n');
      const diffText = `--- a/large.js
+++ b/large.js
@@ -1,500 +1,500 @@
${largeContent.split('\n').map((line) => `+${line}`).join('\n')}`;

      const chunks = chunkDiff(diffText, 5000);

      expect(chunks.length).toBeGreaterThan(1);

      // Each chunk should be within limit (approximately)
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(6000); // Allow some overhead
      });
    });
  });

  describe('File filtering edge cases', () => {
    test('should handle renamed files', () => {
      const diffText = `diff --git a/old.js b/new.js
similarity index 100%
rename from old.js
rename to new.js`;

      const files = parseDiffContent(diffText);
      const filtered = filterFiles(files);

      // Renamed files without content changes should be filtered out
      expect(filtered).toHaveLength(0);
    });

    test('should handle binary files', () => {
      const diffText = `diff --git a/image.png b/image.png
Binary files a/image.png and b/image.png differ`;

      const files = parseDiffContent(diffText);
      const filtered = filterFiles(files);

      // Binary files should be filtered out by extension
      expect(filtered).toHaveLength(0);
    });
  });
});
