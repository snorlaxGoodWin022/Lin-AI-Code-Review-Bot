# AI Code Review Bot

GitHub PR 自动 review 机器人，集成 Claude AI 分析代码。

## 功能

- PR 提交后自动分析代码质量
- 检查代码规范、潜在 bug、性能问题
- 给出具体的优化建议（带代码示例）
- 自动标注问题严重程度（P0/P1/P2）
- 支持自定义审查规则

## 快速开始

### 1. 配置 Secrets

在你的 GitHub 仓库中添加以下 Secrets：

- `GITHUB_TOKEN`：自动提供，无需配置
- `ANTHROPIC_API_KEY`：从 [Anthropic](https://console.anthropic.com/) 获取

### 2. 安装到项目

将 `.github/workflows/code-review.yml` 复制到你的仓库。

### 3. 自定义规则（可选）

在项目根目录创建 `config/review-rules.yaml`：

```yaml
rules:
  - name: "no-console-log"
    severity: P2
    pattern: "console\\.log"
    message: "生产代码中不应包含 console.log"

ignore:
  - "**/*.min.js"
  - "**/dist/**"
```

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Key

# 运行
npm start
```

## 严重程度定义

| 级别 | 图标 | 说明 |
|------|------|------|
| P0 | 🔴 | 严重问题（安全漏洞、必现 Bug） |
| P1 | 🟠 | 重要问题（性能、异常处理缺失） |
| P2 | 🟡 | 改进建议（代码风格、可读性） |

## 技术栈

- Node.js 20
- @octokit/rest (GitHub API)
- @anthropic-ai/sdk (Claude API)
- GitHub Actions

## License

MIT
