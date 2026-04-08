import { Octokit } from '@octokit/rest';

let octokit = null;

export function getOctokit() {
  if (!octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    octokit = new Octokit({ auth: token });
  }
  return octokit;
}
