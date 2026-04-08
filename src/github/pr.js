import { getOctokit } from './client.js';

export async function getPullRequest(owner, repo, pullNumber) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}

export async function getDiff(owner, repo, pullNumber) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    headers: { accept: 'application/vnd.github.v3.diff' },
  });
  return data;
}

export async function getChangedFiles(owner, repo, pullNumber) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}

export function getPullRequestUrl() {
  const githubRef = process.env.GITHUB_REF;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!githubRef || !repository) {
    return null;
  }
  const match = githubRef.match(/refs\/pull\/(\d+)\/merge/);
  if (!match) {
    return null;
  }
  const [owner, repo] = repository.split('/');
  return { owner, repo, pullNumber: parseInt(match[1], 10) };
}
