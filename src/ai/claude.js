import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getLogger } from '../utils/logger.js';

const PROVIDERS = {
  deepseek: {
    type: 'openai',
    baseURL: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  claude: {
    type: 'anthropic',
    defaultModel: 'claude-sonnet-4-6',
  },
  zhipu: {
    type: 'openai',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-5',
  },
};

function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();
  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Supported: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return { provider, config };
}

function getApiKey() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY environment variable is required');
  return apiKey;
}

// --- OpenAI compatible (DeepSeek / 智谱 / 其他) ---

const openaiClients = new Map();

function getOpenAIClient(baseURL) {
  if (!openaiClients.has(baseURL)) {
    openaiClients.set(baseURL, new OpenAI({ apiKey: getApiKey(), baseURL }));
  }
  return openaiClients.get(baseURL);
}

async function analyzeWithOpenAI(prompt, model, maxTokens, baseURL) {
  const client = getOpenAIClient(baseURL);
  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return {
    content: response.choices[0].message.content,
    usage: {
      input_tokens: response.usage.prompt_tokens,
      output_tokens: response.usage.completion_tokens,
    },
  };
}

// --- Claude (Anthropic) ---

let claudeClient = null;

function getClaudeClient() {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey: getApiKey() });
  }
  return claudeClient;
}

async function analyzeWithClaude(prompt, model, maxTokens) {
  const response = await getClaudeClient().messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return {
    content: response.content[0].text,
    usage: response.usage,
  };
}

// --- Unified API ---

export async function analyzeCode(prompt, maxRetries = 3) {
  const logger = getLogger();
  const { provider, config } = getProviderConfig();
  const model = process.env.AI_MODEL || config.defaultModel;
  const maxTokens = parseInt(process.env.MAX_TOKENS || '4096', 10);
  const customBaseURL = process.env.AI_BASE_URL;

  const analyze = config.type === 'anthropic'
    ? () => analyzeWithClaude(prompt, model, maxTokens)
    : () => analyzeWithOpenAI(prompt, model, maxTokens, customBaseURL || config.baseURL);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await analyze();
      logger.info(`[${provider}] API 调用完成 - input: ${result.usage.input_tokens} tokens, output: ${result.usage.output_tokens} tokens`);
      return result;
    } catch (error) {
      logger.warn(`[${provider}] API 调用失败 (尝试 ${attempt}/${maxRetries}): ${error.message}`);
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
