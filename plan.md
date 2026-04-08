# AI Code Review Bot - 技术方案

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ PR Event (opened/synchronize)
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions Workflow                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ 1. 获取PR   │───▶│ 2. AI分析   │───▶│ 3. 发布Review评论   │  │
│  │    Diff     │    │   代码      │    │    + 标签           │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│  GitHub API  │    │  Claude API  │    │  GitHub Review API   │
│  (获取diff)   │    │  (AI分析)    │    │  (发布评论)          │
└──────────────┘    └──────────────┘    └──────────────────────┘
```

## 2. 目录结构

```
ai-code-review-bot/
├── .github/
│   └── workflows/
│       └── code-review.yml      # GitHub Actions 工作流
├── src/
│   ├── index.js                 # 入口文件
│   ├── github/
│   │   ├── client.js            # GitHub API 客户端
│   │   ├── pr.js                # PR 操作（获取diff、发布评论）
│   │   └── review.js            # Review 评论格式化
│   ├── ai/
│   │   ├── claude.js            # Claude API 客户端
│   │   └── prompts/
│   │       ├── review.js        # 代码审查 prompt 模板
│   │       └── severity.js      # 严重程度判断 prompt
│   ├── analyzer/
│   │   ├── diff-parser.js       # Diff 解析器
│   │   ├── chunker.js           # 代码分块（大文件拆分）
│   │   └── filter.js            # 文件过滤（忽略配置）
│   ├── config/
│   │   ├── loader.js            # 配置加载器
│   │   └── rules.js             # 自定义规则处理
│   └── utils/
│       ├── logger.js            # 日志工具
│       └── rate-limiter.js      # API 限流
├── config/
│   └── review-rules.yaml        # 自定义审查规则配置
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── .env.example
└── README.md
```

## 3. 核心模块设计

### 3.1 GitHub 模块

**github/client.js**
```javascript
// 使用 @octokit/rest 作为 GitHub API 客户端
// 提供 PR 获取、评论发布、标签添加等功能
```

**github/pr.js**
- `getPullRequest(owner, repo, number)` - 获取 PR 基本信息
- `getDiff(owner, repo, number)` - 获取 PR diff
- `getChangedFiles(owner, repo, number)` - 获取变更文件列表

**github/review.js**
- `createReviewComment()` - 创建单行评论
- `createReviewSummary()` - 创建 PR 总结评论
- `addLabels()` - 添加严重程度标签

### 3.2 AI 模块

**ai/claude.js**
- 封装 Claude API 调用
- 处理 token 计数和成本控制
- 实现重试和错误处理

**ai/prompts/review.js**
```javascript
const REVIEW_PROMPT = `
你是一个专业的代码审查专家。请分析以下代码变更，关注：

1. **代码规范**: 命名、格式、注释
2. **潜在Bug**: 空指针、边界条件、异常处理
3. **性能问题**: 算法复杂度、内存泄漏、不必要的计算
4. **安全风险**: SQL注入、XSS、敏感信息泄露
5. **可维护性**: 代码复杂度、重复代码、设计模式

对于每个问题，请按以下格式输出：
- **严重程度**: P0(严重)/P1(重要)/P2(建议)
- **文件**: 文件路径
- **行号**: 具体行号
- **问题**: 问题描述
- **建议**: 具体的修复建议
- **示例代码**: 修复后的代码示例（如适用）

代码变更:
\`\`\`diff
{diff}
\`\`\`
`;
```

### 3.3 分析器模块

**analyzer/diff-parser.js**
- 解析 unified diff 格式
- 提取文件名、变更类型、具体行号

**analyzer/chunker.js**
- 将大文件拆分成多个小块
- 确保 Claude API token 限制
- 智能拆分（按函数/类边界）

**analyzer/filter.js**
- 根据 `.gitignore` 和自定义规则过滤文件
- 忽略生成的文件、锁文件等

### 3.4 配置模块

**config/review-rules.yaml**
```yaml
# 自定义审查规则
rules:
  - name: "no-console-log"
    severity: P2
    pattern: "console\\.log"
    message: "生产代码中不应包含 console.log"

  - name: "sql-injection-check"
    severity: P0
    patterns:
      - "executeQuery\\(.*\\+"
      - "\\$\\{.*\\}.*SELECT"
    message: "可能的 SQL 注入风险"

# 文件过滤
ignore:
  - "**/*.min.js"
  - "**/dist/**"
  - "**/node_modules/**"
  - "**/*.lock"
  - "**/*.generated.*"

# 语言特定规则
languages:
  javascript:
    - "no-var"
    - "prefer-const"
  python:
    - "no-bare-except"
```

## 4. GitHub Actions 工作流

**.github/workflows/code-review.yml**
```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run AI Code Review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node src/index.js
```

## 5. 数据流

```
1. PR 事件触发
   │
   ▼
2. GitHub Actions 启动
   │
   ▼
3. 获取 PR diff (GitHub API)
   │
   ▼
4. 解析 diff，提取变更文件
   │
   ▼
5. 过滤需要审查的文件
   │
   ▼
6. 代码分块（如果文件太大）
   │
   ▼
7. 调用 Claude API 分析
   │
   ├── 7.1 代码规范检查
   ├── 7.2 Bug 检测
   ├── 7.3 性能分析
   ├── 7.4 安全检查
   └── 7.5 自定义规则检查
   │
   ▼
8. 解析 AI 返回结果
   │
   ▼
9. 发布 Review 评论
   │
   ├── 9.1 逐行评论（针对具体问题）
   └── 9.2 总结评论（整体评价）
   │
   ▼
10. 添加严重程度标签 (P0/P1/P2)
```

## 6. Review 评论格式

### 6.1 总结评论（PR级别）

```markdown
## 🤖 AI Code Review Report

### 📊 总体评估
- **审查文件数**: 5
- **发现问题**: 8 个
  - 🔴 P0 (严重): 1
  - 🟠 P1 (重要): 3
  - 🟡 P2 (建议): 4

### 📋 问题列表

#### 🔴 P0 - 严重问题

**1. SQL 注入风险**
- **文件**: `src/db/queries.js`
- **行号**: 42
- **问题**: 直接拼接用户输入到 SQL 查询
- **建议**: 使用参数化查询

\`\`\`javascript
// 修改前
const query = `SELECT * FROM users WHERE id = ${userId}`;

// 修改后
const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [userId]);
\`\`\`

---

*此 review 由 AI 自动生成，仅供参考*
```

### 6.2 逐行评论

对于具体代码行的问题，使用 GitHub 的 review comments API 直接在代码上标注。

## 7. 配置文件

### 7.1 package.json

```json
{
  "name": "ai-code-review-bot",
  "version": "1.0.0",
  "description": "AI-powered GitHub PR review bot",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@octokit/rest": "^20.1.1",
    "dotenv": "^16.4.5",
    "js-yaml": "^4.1.0",
    "parse-diff": "^0.11.1"
  },
  "devDependencies": {
    "eslint": "^8.57.0",
    "jest": "^29.7.0"
  }
}
```

### 7.2 .env.example

```env
# GitHub Token (需要 repo 和 pull_request 权限)
GITHUB_TOKEN=

# Anthropic API Key
ANTHROPIC_API_KEY=

# Claude 模型选择
CLAUDE_MODEL=claude-sonnet-4-6

# 最大 token 数
MAX_TOKENS=4096

# 日志级别
LOG_LEVEL=info
```

## 8. 实现步骤

### Phase 1: 基础框架 (Day 1-2) ✅ 已完成
- [x] 初始化项目结构
- [x] 配置 package.json 和依赖
- [x] 实现 GitHub API 客户端
- [x] 实现 Claude API 客户端
- [x] 配置 GitHub Actions 工作流

### Phase 2: 核心功能 (Day 3-4) ✅ 已完成
- [x] 实现 diff 解析器
- [x] 实现代码分块逻辑
- [x] 设计和实现 AI prompt 模板
- [x] 实现 review 结果解析
- [x] 实现评论发布逻辑

### Phase 3: 增强功能 (Day 5-6) ✅ 已完成
- [x] 实现自定义规则配置
- [x] 实现文件过滤
- [x] 实现严重程度标签
- [x] 添加错误处理和重试机制
- [x] 实现 API 限流

### Phase 4: 测试和优化 (Day 7) ✅ 已完成
- [x] 编写单元测试
- [x] 编写集成测试  
- [x] 性能优化
- [x] 文档完善
- [x] 部署测试

## 9. 关键技术点

### 9.1 Token 限制处理 ✅ 已实现
- Claude API 有 token 限制
- 需要智能拆分大文件 → `src/analyzer/chunker.js`
- 优先分析核心代码（跳过样式、配置文件）→ `src/analyzer/filter.js`

### 9.2 成本控制 ✅ 已实现
- 记录每次 API 调用的 token 使用量 → `src/ai/claude.js` 输出 usage 日志
- 设置每日/每 PR 的调用上限 → `src/utils/rate-limiter.js`
- 缓存相同代码的分析结果 → 待优化

### 9.3 错误处理 ✅ 已实现
- API 调用失败时的重试机制 → `src/ai/claude.js` 重试逻辑
- 超时处理 → 待完善
- 部分失败不影响其他文件的分析 → `src/index.js` try-catch 单文件失败

### 9.4 评论去重 🚧 待实现
- 避免对同一问题重复评论
- 记录已评论的问题

## 10. 扩展计划

### v1.1
- [ ] 支持增量 review（只分析新增/修改的代码）
- [ ] 支持多语言 prompt
- [ ] 支持自定义 AI 模型

### v1.2
- [ ] 学习用户反馈（标记误报）
- [ ] 生成 review 报告（PDF/HTML）
- [ ] 支持 GitLab/Bitbucket

### v2.0
- [ ] 支持 Skill 配置（用户自定义 prompt）
- [ ] 支持代码上下文分析（跨文件）
- [ ] 支持历史 review 数据分析

---

## 11. 当前状态

**完成进度: 95%**

**单元测试**: ✅ 已实现 (66 个测试用例)
**集成测试**: ✅ 已实现 (5 个测试用例)
**部署测试**: ⏳ 待实际环境验证

| 模块 | 状态 | 文件 |
|------|------|------|
| GitHub API 客户端 | ✅ | `src/github/client.js`, `src/github/pr.js`, `src/github/review.js` |
| Claude AI 客户端 | ✅ | `src/ai/claude.js`, `src/ai/prompts/*.js` |
| Diff 解析器 | ✅ | `src/analyzer/diff-parser.js` |
| 代码分块 | ✅ | `src/analyzer/chunker.js` |
| 文件过滤 | ✅ | `src/analyzer/filter.js` |
| 配置加载 | ✅ | `src/config/loader.js`, `src/config/rules.js` |
| 自定义规则 | ✅ | `config/review-rules.yaml` |
| 工具模块 | ✅ | `src/utils/logger.js`, `src/utils/rate-limiter.js` |
| GitHub Actions | ✅ | `.github/workflows/code-review.yml` |
| 主入口 | ✅ | `src/index.js` |
| 文档 | ✅ | `README.md`, `CLAUDE.md` |
| 单元测试 | ✅ | `tests/unit/*.test.js` (66 测试) |
| 集成测试 | ✅ | `tests/integration/*.test.js` (5 测试) |
| 部署测试 | ⏳ | 待实际环境验证 |

**下一步:**
1. 在实际 GitHub 仓库中进行测试
2. 根据使用反馈优化 prompts
3. 完善错误处理和日志
