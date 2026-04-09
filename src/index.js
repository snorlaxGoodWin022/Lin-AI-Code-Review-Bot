import 'dotenv/config';
import { getLogger } from './utils/logger.js';
import { getPullRequestUrl, getDiff, getChangedFiles } from './github/pr.js';
import { parseDiffContent, getFileName, getFileDiffText } from './analyzer/diff-parser.js';
import { filterFiles } from './analyzer/filter.js';
import { chunkDiff } from './analyzer/chunker.js';
import { analyzeCode } from './ai/claude.js';
import { buildReviewPrompt } from './ai/prompts/review.js';
import { createReviewSummary, addLabels } from './github/review.js';
import { loadConfig } from './config/loader.js';
import { extractRules, extractIgnorePatterns, checkCustomRules } from './config/rules.js';
import { RateLimiter } from './utils/rate-limiter.js';

const logger = getLogger();
const rateLimiter = new RateLimiter(10, 60_000); // 60秒内最多10次API调用

async function main() {
  logger.info('AI Code Review Bot 启动');

  // 1. 获取 PR 信息
  const prInfo = getPullRequestUrl();
  if (!prInfo) {
    logger.error('无法获取 PR 信息，请确认在 GitHub Actions 环境中运行');
    process.exit(1);
  }

  const { owner, repo, pullNumber } = prInfo;
  logger.info(`审查 PR: ${owner}/${repo}#${pullNumber}`);

  // 2. 加载配置
  const config = loadConfig();
  const rules = extractRules(config);
  const ignorePatterns = extractIgnorePatterns(config);
  logger.info(`加载 ${rules.length} 条自定义规则`);

  // 3. 获取并解析 diff
  const diffText = await getDiff(owner, repo, pullNumber);
  const parsedFiles = parseDiffContent(diffText);
  logger.info(`解析到 ${parsedFiles.length} 个变更文件`);

  // 4. 过滤文件
  const filesToReview = filterFiles(parsedFiles, ignorePatterns);
  logger.info(`需要审查 ${filesToReview.length} 个文件`);

  if (filesToReview.length === 0) {
    logger.info('没有需要审查的文件');
    return;
  }

  // 5. 分析每个文件
  const allIssues = [];

  for (const file of filesToReview) {
    const fileName = getFileName(file);
    const fileDiff = getFileDiffText(file);

    // 5.1 自定义规则检查
    const ruleIssues = checkCustomRules(fileName, fileDiff, rules);
    allIssues.push(...ruleIssues);

    // 5.2 AI 分析
    const chunks = chunkDiff(fileDiff);
    for (const chunk of chunks) {
      try {
        await rateLimiter.wait();
        const prompt = buildReviewPrompt(chunk, fileName, rules);
        const result = await analyzeCode(prompt);

        // 解析 AI 返回的 JSON（兼容多种格式）
        let parsed = null;
        const content = result.content;

        // 尝试 1: ```json ... ``` 包裹
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[1]); } catch {}
        }

        // 尝试 2: ``` ... ``` 包裹
        if (!parsed) {
          const codeMatch = content.match(/```\s*([\s\S]*?)```/);
          if (codeMatch) {
            try { parsed = JSON.parse(codeMatch[1]); } catch {}
          }
        }

        // 尝试 3: 直接找 { ... } JSON 对象
        if (!parsed) {
          const braceMatch = content.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try { parsed = JSON.parse(braceMatch[0]); } catch {}
          }
        }

        if (parsed && parsed.issues) {
          allIssues.push(...parsed.issues);
          logger.info(`AI 发现 ${parsed.issues.length} 个问题 (${fileName})`);
        } else {
          logger.warn(`AI 未返回有效 JSON (${fileName})，原始内容: ${content.substring(0, 200)}`);
        }
      } catch (error) {
        logger.error(`分析文件 ${fileName} 失败: ${error.message}`);
        // 单个文件失败不影响其他文件
      }
    }
  }

  logger.info(`共发现 ${allIssues.length} 个问题`);

  // 6. 发布 Review
  const summaryBody = formatSummaryBody(filesToReview.length, allIssues);
  await createReviewSummary(owner, repo, pullNumber, summaryBody);
  logger.info('已发布 Review 总结');

  // 7. 添加标签
  await addLabels(owner, repo, pullNumber, allIssues);
  logger.info('已添加标签');

  logger.info('AI Code Review 完成');
}

function formatSummaryBody(fileCount, issues) {
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
    const groups = [
      ['🔴 P0 - 严重问题', p0],
      ['🟠 P1 - 重要问题', p1],
      ['🟡 P2 - 改进建议', p2],
    ];
    for (const [label, group] of groups) {
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

main().catch((error) => {
  logger.error(`运行失败: ${error.message}`);
  process.exit(1);
});
