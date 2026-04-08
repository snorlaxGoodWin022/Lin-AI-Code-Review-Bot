export const SEVERITY_DEFINITIONS = {
  P0: {
    label: '严重',
    icon: '🔴',
    keywords: ['安全漏洞', 'SQL注入', 'XSS', '数据丢失', '必现Bug', '内存泄漏', '权限绕过', '注入', '跨站脚本'],
  },
  P1: {
    label: '重要',
    icon: '🟠',
    keywords: ['性能问题', '异常处理', '设计缺陷', '资源泄漏', '并发问题', '边界条件', '未处理', '缺少'],
  },
  P2: {
    label: '建议',
    icon: '🟡',
    keywords: ['代码风格', '可读性', '命名', '注释', '最佳实践', '重复代码', '建议'],
  },
};

export function classifySeverity(text) {
  const lower = text.toLowerCase();
  if (SEVERITY_DEFINITIONS.P0.keywords.some((k) => lower.includes(k.toLowerCase()))) {
    return 'P0';
  }
  if (SEVERITY_DEFINITIONS.P1.keywords.some((k) => lower.includes(k.toLowerCase()))) {
    return 'P1';
  }
  return 'P2';
}
