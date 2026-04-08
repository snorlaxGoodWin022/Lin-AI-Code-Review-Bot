import { getPullRequestUrl } from '../../src/github/pr.js';

describe('github/pr', () => {
  describe('getPullRequestUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should parse PR URL from GitHub Actions environment', () => {
      process.env.GITHUB_REF = 'refs/pull/123/merge';
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      const result = getPullRequestUrl();

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        pullNumber: 123,
      });
    });

    test('should return null when not in GitHub Actions', () => {
      delete process.env.GITHUB_REF;
      delete process.env.GITHUB_REPOSITORY;

      const result = getPullRequestUrl();

      expect(result).toBeNull();
    });

    test('should return null for non-PR refs', () => {
      process.env.GITHUB_REF = 'refs/heads/main';
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      const result = getPullRequestUrl();

      expect(result).toBeNull();
    });
  });
});
