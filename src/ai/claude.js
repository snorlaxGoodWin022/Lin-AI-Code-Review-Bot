import Anthropic from '@anthropic-ai/sdk';
import { getLogger } from '../utils/logger.js';

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function analyzeCode(prompt, maxRetries = 3) {
  const logger = getLogger();
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
  const maxTokens = parseInt(process.env.MAX_TOKENS || '4096', 10);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await getClient().messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const usage = response.usage;
      logger.info(`Claude API 调用完成 - input: ${usage.input_tokens} tokens, output: ${usage.output_tokens} tokens`);

      return {
        content: response.content[0].text,
        usage,
      };
    } catch (error) {
      logger.warn(`Claude API 调用失败 (尝试 ${attempt}/${maxRetries}): ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
