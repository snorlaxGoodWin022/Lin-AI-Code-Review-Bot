import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../src/config/loader.js';

// Mock fs module
jest.mock('fs');

describe('config/loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    test('should load yaml config file', () => {
      const yamlContent = `
rules:
  - name: test-rule
    severity: P1
    pattern: "test"
ignore:
  - "**/dist/**"
`;
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(yamlContent);

      const config = loadConfig('/path/to/config.yaml');

      expect(config.rules).toHaveLength(1);
      expect(config.rules[0].name).toBe('test-rule');
      expect(config.ignore).toHaveLength(1);
    });

    test('should return default config when no file found', () => {
      fs.existsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config.rules).toEqual([]);
      expect(config.ignore).toEqual([]);
    });

    test('should handle malformed yaml', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid: yaml: content: [');

      const config = loadConfig('/path/to/config.yaml');

      expect(config.rules).toEqual([]);
      expect(config.ignore).toEqual([]);
    });
  });
});
