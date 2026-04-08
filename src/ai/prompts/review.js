export function buildReviewPrompt(diff, fileName, customRules = []) {
  let rulesSection = '';
  if (customRules.length > 0) {
    rulesSection = `
### 自定义审查规则
${customRules.map((rule) => `- [${rule.severity}] ${rule.name}: ${rule.message} (匹配模式: ${rule.pattern})`).join('\n')}
`;
  }

  return `你是一个专业的代码审查专家。请分析以下代码变更，用中文回答。

## 审查维度
1. **代码规范**: 命名、格式、注释
2. **潜在Bug**: 空指针、边界条件、异常处理
3. **性能问题**: 算法复杂度、内存泄漏、不必要的计算
4. **安全风险**: SQL注入、XSS、敏感信息泄露
5. **可维护性**: 代码复杂度、重复代码、设计模式
${rulesSection}

## 输出格式
请严格按以下 JSON 格式输出，不要包含其他内容：
\`\`\`json
{
  "issues": [
    {
      "severity": "P0|P1|P2",
      "title": "问题标题",
      "file": "${fileName}",
      "line": 行号或null,
      "description": "问题描述",
      "suggestion": "修复建议",
      "codeExample": "修复后的代码示例或null"
    }
  ]
}
\`\`\`

严重程度定义：
- P0: 严重问题（安全漏洞、必现Bug、数据丢失风险）
- P1: 重要问题（性能问题、异常处理缺失、设计缺陷）
- P2: 改进建议（代码风格、可读性、最佳实践）

## 代码变更
文件: ${fileName}

\`\`\`diff
${diff}
\`\`\``;
}
