import { buildReviewPrompt } from '../../src/ai/prompts/review.js';
import { classifySeverity, SEVERITY_DEFINITIONS } from '../../src/ai/prompts/severity.js';

describe('ai/prompts', () => {
  describe('buildReviewPrompt', () => {
    test('should build prompt with diff content', () => {
      const diff = '+const a = 1;';
      const fileName = 'test.js';

      const prompt = buildReviewPrompt(diff, fileName);

      expect(prompt).toContain('代码审查专家');
      expect(prompt).toContain('test.js');
      expect(prompt).toContain('+const a = 1;');
      expect(prompt).toContain('P0|P1|P2');
    });

    test('should include custom rules', () => {
      const customRules = [
        { name: 'no-console', severity: 'P2', pattern: 'console\\.log', message: 'No console.log' },
      ];

      const prompt = buildReviewPrompt('diff', 'test.js', customRules);

      expect(prompt).toContain('自定义审查规则');
      expect(prompt).toContain('no-console');
    });

    test('should include all review dimensions', () => {
      const prompt = buildReviewPrompt('diff', 'test.js');

      expect(prompt).toContain('代码规范');
      expect(prompt).toContain('潜在Bug');
      expect(prompt).toContain('性能问题');
      expect(prompt).toContain('安全风险');
      expect(prompt).toContain('可维护性');
    });

    test('should request JSON output format', () => {
      const prompt = buildReviewPrompt('diff', 'test.js');

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('severity');
      expect(prompt).toContain('title');
      expect(prompt).toContain('description');
      expect(prompt).toContain('suggestion');
    });
  });

  describe('SEVERITY_DEFINITIONS', () => {
    test('should have P0, P1, P2 levels', () => {
      expect(SEVERITY_DEFINITIONS.P0).toBeDefined();
      expect(SEVERITY_DEFINITIONS.P1).toBeDefined();
      expect(SEVERITY_DEFINITIONS.P2).toBeDefined();
    });

    test('should have keywords for each level', () => {
      expect(SEVERITY_DEFINITIONS.P0.keywords.length).toBeGreaterThan(0);
      expect(SEVERITY_DEFINITIONS.P1.keywords.length).toBeGreaterThan(0);
      expect(SEVERITY_DEFINITIONS.P2.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('classifySeverity', () => {
    test('should classify P0 security issues', () => {
      expect(classifySeverity('发现SQL注入漏洞')).toBe('P0');
      expect(classifySeverity('存在XSS跨站脚本攻击风险')).toBe('P0');
      expect(classifySeverity('可能导致数据丢失')).toBe('P0');
    });

    test('should classify P1 performance issues', () => {
      expect(classifySeverity('存在性能问题')).toBe('P1');
      expect(classifySeverity('缺少异常处理')).toBe('P1');
      expect(classifySeverity('边界条件未处理')).toBe('P1');
    });

    test('should classify P2 style issues', () => {
      expect(classifySeverity('代码风格不一致')).toBe('P2');
      expect(classifySeverity('命名不规范')).toBe('P2');
      expect(classifySeverity('建议添加注释')).toBe('P2');
    });

    test('should default to P2 for unknown', () => {
      expect(classifySeverity('这是一些普通建议')).toBe('P2');
    });
  });
});
