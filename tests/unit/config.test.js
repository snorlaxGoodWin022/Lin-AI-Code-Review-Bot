import { extractRules, extractIgnorePatterns, checkCustomRules } from '../../src/config/rules.js';

describe('config/rules', () => {
  describe('extractRules', () => {
    test('should extract rules from config', () => {
      const config = {
        rules: [
          { name: 'no-console', severity: 'P2', pattern: 'console\\.log', message: 'No console.log' },
        ],
      };

      const rules = extractRules(config);

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('no-console');
      expect(rules[0].severity).toBe('P2');
      expect(rules[0].patterns).toHaveLength(1);
      expect(rules[0].patterns[0]).toBeInstanceOf(RegExp);
    });

    test('should handle multiple patterns in a rule', () => {
      const config = {
        rules: [
          {
            name: 'security',
            severity: 'P0',
            patterns: ['eval\\(', 'Function\\('],
            message: 'Security risk',
          },
        ],
      };

      const rules = extractRules(config);

      expect(rules[0].patterns).toHaveLength(2);
    });

    test('should return empty array for empty config', () => {
      expect(extractRules(null)).toEqual([]);
      expect(extractRules({})).toEqual([]);
      expect(extractRules({ rules: [] })).toEqual([]);
    });

    test('should default severity to P2', () => {
      const config = {
        rules: [{ name: 'test', pattern: 'test' }],
      };

      const rules = extractRules(config);

      expect(rules[0].severity).toBe('P2');
    });
  });

  describe('extractIgnorePatterns', () => {
    test('should extract ignore patterns from config', () => {
      const config = {
        ignore: ['**/dist/**', '*.min.js'],
      };

      const patterns = extractIgnorePatterns(config);

      expect(patterns).toHaveLength(2);
      expect(patterns[0]).toBeInstanceOf(RegExp);
    });

    test('should return empty array for empty config', () => {
      expect(extractIgnorePatterns(null)).toEqual([]);
      expect(extractIgnorePatterns({})).toEqual([]);
    });
  });

  describe('checkCustomRules', () => {
    const rules = [
      {
        name: 'no-console-log',
        severity: 'P2',
        patterns: [/console\.log/],
        message: 'No console.log allowed',
      },
      {
        name: 'no-debugger',
        severity: 'P1',
        patterns: [/debugger/],
        message: 'No debugger allowed',
      },
    ];

    test('should detect rule violations', () => {
      const diffText = `const a = 1;
+console.log('test');
+const b = 2;`;

      const issues = checkCustomRules('test.js', diffText, rules);

      expect(issues).toHaveLength(1);
      expect(issues[0].name).toBe('no-console-log');
      expect(issues[0].severity).toBe('P2');
    });

    test('should not detect violations in removed lines', () => {
      const diffText = `-console.log('old');
-const a = 1;`;

      const issues = checkCustomRules('test.js', diffText, rules);

      expect(issues).toHaveLength(0);
    });

    test('should detect multiple violations', () => {
      const diffText = `+console.log('test');
+debugger;
+const a = 1;`;

      const issues = checkCustomRules('test.js', diffText, rules);

      expect(issues).toHaveLength(2);
    });

    test('should not match file headers', () => {
      const diffText = `+++ b/test.js
+console.log('test');`;

      const issues = checkCustomRules('test.js', diffText, rules);

      expect(issues).toHaveLength(1); // 只匹配 console.log，不匹配 +++
    });

    test('should return empty array for no violations', () => {
      const diffText = `+const a = 1;
+const b = 2;`;

      const issues = checkCustomRules('test.js', diffText, rules);

      expect(issues).toHaveLength(0);
    });
  });
});
