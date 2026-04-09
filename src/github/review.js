import { getOctokit } from './client.js';

const SEVERITY_LABELS = {
  P0: 'bug',
  P1: 'enhancement',
  P2: 'question',
};

const SEVERITY_ICONS = {
  P0: '🔴',
  P1: '🟠',
  P2: '🟡',
};

export function formatReviewComment(issue) {
  const icon = SEVERITY_ICONS[issue.severity] || '⚪';
  let comment = `**${icon} ${issue.severity}** - ${issue.title}\n\n`;
  comment += `- **文件**: \`${issue.file}\`\n`;
  if (issue.line) {
    comment += `- **行号**: ${issue.line}\n`;
  }
  comment += `- **问题**: ${issue.description}\n`;
  comment += `- **建议**: ${issue.suggestion}\n`;
  if (issue.codeExample) {
    comment += `\n\`\`\`suggestion\n${issue.codeExample}\n\`\`\`\n`;
  }
  return comment;
}

export function formatSummaryComment(results) {
  const { fileCount, issues } = results;
  const p0 = issues.filter((i) => i.severity === 'P0');
  const p1 = issues.filter((i) => i.severity === 'P1');
  const p2 = issues.filter((i) => i.severity === 'P2');

  let body = '## 🤖 AI Code Review Report\n\n';
  body += '### 📊 总体评估\n';
  body += `- **审查文件数**: ${fileCount}\n`;
  body += `- **发现问题**: ${issues.length} 个\n`;
  body += `  - 🔴 P0 (严重): ${p0.length}\n`;
  body += `  - 🟠 P1 (重要): ${p1.length}\n`;
  body += `  - 🟡 P2 (建议): ${p2.length}\n\n`;

  if (issues.length === 0) {
    body += '✅ 未发现明显问题，代码看起来不错！\n';
  } else {
    for (const [label, group] of [
      ['🔴 P0 - 严重问题', p0],
      ['🟠 P1 - 重要问题', p1],
      ['🟡 P2 - 改进建议', p2],
    ]) {
      if (group.length === 0) continue;
      body += `### ${label}\n\n`;
      group.forEach((issue, idx) => {
        body += `**${idx + 1}. ${issue.title}**\n`;
        body += `- **文件**: \`${issue.file}\`${issue.line ? `:${issue.line}` : ''}\n`;
        body += `- **问题**: ${issue.description}\n`;
        body += `- **建议**: ${issue.suggestion}\n`;
        if (issue.codeExample) {
          body += `\n<details><summary>示例代码</summary>\n\n\`\`\`javascript\n${issue.codeExample}\n\`\`\`\n</details>\n\n`;
        }
      });
      body += '\n';
    }
  }

  body += '\n---\n\n*此 review 由 AI 自动生成，仅供参考*\n';
  return body;
}

export async function createReviewSummary(owner, repo, pullNumber, body) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event: 'COMMENT',
  });
  return data;
}

export async function createReviewComment(owner, repo, pullNumber, reviewId, comment) {
  const octokit = getOctokit();
  await octokit.rest.pulls.createComment({
    owner,
    repo,
    pull_number: pullNumber,
    body: comment.body,
    commit_id: comment.commitId,
    path: comment.path,
    line: comment.line,
    side: 'RIGHT',
  });
}

export async function getExistingBotReviews(owner, repo, pullNumber) {
  const octokit = getOctokit();
  const { data: reviews } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // 只获取 github-actions bot 发布的 review
  const botReviews = reviews.filter(
    (r) => r.user.login === 'github-actions[bot]' && r.body
  );

  // 提取已报告过的文件+行号+标题作为去重 key
  const reported = new Set();
  for (const review of botReviews) {
    // 匹配模式: **文件**: `xxx`  + 行号 + 标题
    const fileMatches = review.body.matchAll(/\*\*文件\*\*: `([^`]+)`(?::(\d+))?/g);
    for (const m of fileMatches) {
      reported.add(m[1] + ':' + (m[2] || ''));
    }
    // 匹配标题行: **1. xxx** 或 **N. xxx**
    const titleMatches = review.body.matchAll(/\*\*\d+\.\s+(.+?)\*\*/g);
    for (const m of titleMatches) {
      reported.add(m[1]);
    }
  }
  return reported;
}

export function deduplicateIssues(issues, reportedKeys) {
  return issues.filter((issue) => {
    // 按 file+line 去重
    const locationKey = `${issue.file}:${issue.line || ''}`;
    if (reportedKeys.has(locationKey)) return false;
    // 按标题去重
    if (issue.title && reportedKeys.has(issue.title)) return false;
    return true;
  });
}

export async function deletePreviousBotReviews(owner, repo, pullNumber) {
  const octokit = getOctokit();
  const { data: reviews } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const botReviews = reviews.filter(
    (r) => r.user.login === 'github-actions[bot]'
  );

  for (const review of botReviews) {
    await octokit.rest.pulls.deletePendingReview({
      owner,
      repo,
      pull_number: pullNumber,
      review_id: review.id,
    });
  }
  return botReviews.length;
}

export async function addLabels(owner, repo, pullNumber, issues) {
  const octokit = getOctokit();
  const labels = new Set();

  for (const issue of issues) {
    const label = SEVERITY_LABELS[issue.severity];
    if (label) labels.add(label);
  }

  if (labels.size > 0) {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pullNumber,
      labels: [...labels],
    });
  }
}
