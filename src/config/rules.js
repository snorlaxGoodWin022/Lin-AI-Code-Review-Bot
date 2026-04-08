export function extractRules(config) {
  if (!config || !config.rules) {
    return [];
  }
  return config.rules.map((rule) => {
    const patterns = rule.patterns || (rule.pattern ? [rule.pattern] : []);
    return {
      name: rule.name,
      severity: rule.severity || 'P2',
      patterns: patterns.map((p) => new RegExp(p)),
      message: rule.message || `违反规则: ${rule.name}`,
    };
  });
}

export function extractIgnorePatterns(config) {
  if (!config || !config.ignore) {
    return [];
  }
  return config.ignore.map((pattern) => {
    // 将 glob 模式转换为简单的字符串匹配或正则
    const regexStr = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    return new RegExp(regexStr);
  });
}

export function checkCustomRules(fileName, diffText, rules) {
  const issues = [];
  const lines = diffText.split('\n');

  for (const rule of rules) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 只检查新增的行
      if (!line.startsWith('+') || line.startsWith('+++')) continue;

      for (const pattern of rule.patterns) {
        if (pattern.test(line)) {
          issues.push({
            severity: rule.severity,
            title: rule.name,
            file: fileName,
            line: i + 1,
            description: rule.message,
            suggestion: `修复以符合规则 "${rule.name}"`,
            codeExample: null,
          });
        }
      }
    }
  }

  return issues;
}
