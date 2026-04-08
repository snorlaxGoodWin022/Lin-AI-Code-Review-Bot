import { jest } from '@jest/globals';
import { getLogger } from '../../src/utils/logger.js';
import { RateLimiter } from '../../src/utils/rate-limiter.js';

describe('utils/logger', () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL;
  });

  describe('getLogger', () => {
    test('should return singleton logger instance', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    test('should have debug, info, warn, error methods', () => {
      const logger = getLogger();

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});

describe('utils/rate-limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('RateLimiter', () => {
    test('should allow calls under limit', async () => {
      const limiter = new RateLimiter(3, 1000);

      await limiter.wait();
      await limiter.wait();
      await limiter.wait();

      // 不应该抛出错误
      expect(true).toBe(true);
    });

    test('should wait when limit exceeded', async () => {
      const limiter = new RateLimiter(2, 1000);

      await limiter.wait();
      await limiter.wait();

      const promise = limiter.wait();

      // 快进时间
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      // 继续快进直到完成
      jest.advanceTimersByTime(600);

      await expect(promise).resolves.toBeUndefined();
    });

    test('should clean up old calls', async () => {
      const limiter = new RateLimiter(2, 100);

      await limiter.wait();
      await limiter.wait();

      // 等待窗口过期
      jest.advanceTimersByTime(150);

      // 应该可以再次调用
      await limiter.wait();

      expect(true).toBe(true);
    });
  });
});
