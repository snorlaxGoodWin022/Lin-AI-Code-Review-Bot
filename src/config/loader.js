import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { getLogger } from '../utils/logger.js';

const DEFAULT_CONFIG = {
  rules: [],
  ignore: [],
};

export function loadConfig(configPath) {
  const logger = getLogger();

  const searchPaths = [
    configPath,
    path.join(process.cwd(), 'config', 'review-rules.yaml'),
    path.join(process.cwd(), 'config', 'review-rules.yml'),
    path.join(process.cwd(), '.ai-review-rules.yaml'),
  ];

  for (const p of searchPaths) {
    if (p && fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const config = yaml.load(content);
        logger.info(`加载配置文件: ${p}`);
        return { ...DEFAULT_CONFIG, ...config };
      } catch (error) {
        logger.warn(`配置文件解析失败 ${p}: ${error.message}`);
      }
    }
  }

  logger.info('未找到自定义配置，使用默认配置');
  return DEFAULT_CONFIG;
}
