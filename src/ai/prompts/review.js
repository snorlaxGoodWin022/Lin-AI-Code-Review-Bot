const LANG_CONFIG = {
  zh: {
    instruction: '用中文回答',
    dimensions: [
      '代码规范: 命名、格式、注释',
      '潜在Bug: 空指针、边界条件、异常处理',
      '性能问题: 算法复杂度、内存泄漏、不必要的计算',
      '安全风险: SQL注入、XSS、敏感信息泄露',
      '可维护性: 代码复杂度、重复代码、设计模式',
    ],
    severities: [
      'P0: 严重问题（安全漏洞、必现Bug、数据丢失风险）',
      'P1: 重要问题（性能问题、异常处理缺失、设计缺陷）',
      'P2: 改进建议（代码风格、可读性、最佳实践）',
    ],
    customRulesHeader: '自定义审查规则',
  },
  en: {
    instruction: 'answer in English',
    dimensions: [
      'Code Style: naming, formatting, comments',
      'Potential Bugs: null pointers, edge cases, error handling',
      'Performance: algorithm complexity, memory leaks, unnecessary computation',
      'Security Risks: SQL injection, XSS, sensitive data exposure',
      'Maintainability: code complexity, duplication, design patterns',
    ],
    severities: [
      'P0: Critical (security vulnerabilities, guaranteed bugs, data loss)',
      'P1: Important (performance issues, missing error handling, design flaws)',
      'P2: Suggestion (code style, readability, best practices)',
    ],
    customRulesHeader: 'Custom Rules',
  },
};

function getLangConfig() {
  const lang = (process.env.REVIEW_LANGUAGE || 'zh').toLowerCase();
  return LANG_CONFIG[lang] || LANG_CONFIG.zh;
}

export function buildReviewPrompt(diff, fileName, customRules = []) {
  const lang = getLangConfig();

  let rulesSection = '';
  if (customRules.length > 0) {
    rulesSection = `
### ${lang.customRulesHeader}
${customRules.map((rule) => `- [${rule.severity}] ${rule.name}: ${rule.message}`).join('\n')}
`;
  }

  const dimensions = lang.dimensions.map((d, i) => `${i + 1}. **${d}**`).join('\n');
  const severities = lang.severities.map((s) => `- ${s}`).join('\n');

  return `You are a professional code reviewer. Analyze the following code changes and ${lang.instruction}.

## Review Dimensions
${dimensions}
${rulesSection}

## Output Format
Output raw JSON only, no markdown code blocks, no extra text:
{"issues": [{"severity": "P0 or P1 or P2", "title": "issue title", "file": "${fileName}", "line": line number or null, "description": "issue description", "suggestion": "fix suggestion", "codeExample": "fixed code or null"}]}

If no issues found: {"issues": []}

Severity:
${severities}

## Code Changes
File: ${fileName}

${diff}`;
}
