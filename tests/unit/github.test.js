import { formatReviewComment, formatSummaryComment, SEVERITY_LABELS } from '../../src/github/review.js';

describe('github/review', () => {
  describe('formatReviewComment', () => {
    test('should format P0 issue correctly', () => {
      const issue = {
        severity: 'P0',
        title: 'SQL Injection',
        file: 'src/db.js',
        line: 42,
        description: 'Direct SQL concatenation',
        suggestion: 'Use parameterized queries',
        codeExample: 'db.query("SELECT * FROM users WHERE id = ?", [userId])',
      };

      const comment = formatReviewComment(issue);

      expect(comment).toContain('🔴');
      expect(comment).toContain('P0');
      expect(comment).toContain('SQL Injection');
      expect(comment).toContain('src/db.js');
      expect(comment).toContain('42');
    });

    test('should format issue without line number', () => {
      const issue = {
        severity: 'P2',
        title: 'Code Style',
        file: 'src/utils.js',
        description: 'Missing semicolon',
        suggestion: 'Add semicolon',
      };

      const comment = formatReviewComment(issue);

      expect(comment).toContain('🟡');
      expect(comment).toContain('Code Style');
    });

    test('should include code example when provided', () => {
      const issue = {
        severity: 'P1',
        title: 'Bug',
        file: 'test.js',
        description: 'desc',
        suggestion: 'fix it',
        codeExample: 'const fixed = true;',
      };

      const comment = formatReviewComment(issue);

      expect(comment).toContain('```suggestion');
      expect(comment).toContain('const fixed = true;');
    });
  });

  describe('formatSummaryComment', () => {
    test('should format summary with issues', () => {
      const results = {
        fileCount: 3,
        issues: [
          { severity: 'P0', title: 'Critical', file: 'a.js', description: 'd', suggestion: 's' },
          { severity: 'P1', title: 'Important', file: 'b.js', description: 'd', suggestion: 's' },
          { severity: 'P1', title: 'Important2', file: 'c.js', description: 'd', suggestion: 's' },
          { severity: 'P2', title: 'Suggestion', file: 'd.js', description: 'd', suggestion: 's' },
        ],
      };

      const body = formatSummaryComment(results);

      expect(body).toContain('🤖 AI Code Review Report');
      expect(body).toContain('审查文件数: 3');
      expect(body).toContain('发现问题: 4 个');
      expect(body).toContain('P0 (严重): 1');
      expect(body).toContain('P1 (重要): 2');
      expect(body).toContain('P2 (建议): 1');
    });

    test('should handle no issues', () => {
      const results = {
        fileCount: 1,
        issues: [],
      };

      const body = formatSummaryComment(results);

      expect(body).toContain('未发现明显问题');
    });

    test('should group issues by severity', () => {
      const results = {
        fileCount: 1,
        issues: [
          { severity: 'P1', title: 'Issue 1', file: 'a.js', description: 'd', suggestion: 's' },
          { severity: 'P0', title: 'Issue 2', file: 'b.js', description: 'd', suggestion: 's' },
        ],
      };

      const body = formatSummaryComment(results);

      // P0 应该在 P1 前面
      const p0Index = body.indexOf('🔴 P0');
      const p1Index = body.indexOf('🟠 P1');

      expect(p0Index).toBeLessThan(p1Index);
    });

    test('should include code examples in details', () => {
      const results = {
        fileCount: 1,
        issues: [
          {
            severity: 'P1',
            title: 'Issue',
            file: 'a.js',
            description: 'd',
            suggestion: 's',
            codeExample: 'const fixed = true;',
          },
        ],
      };

      const body = formatSummaryComment(results);

      expect(body).toContain('<details>');
      expect(body).toContain('const fixed = true;');
    });
  });
});
