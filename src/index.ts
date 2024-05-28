import * as github from '@actions/github';
import * as core from '@actions/core';

async function run() {
  const cacheKey = core.getInput('cache_key', { required: false });
  const token = core.getInput('token', { required: true });
  const octokit = github.getOctokit(token);

  if (!cacheKey) {
    core.warning('No cache key specified. Skipping cache deletion.');
    return;
  }

  const { data: cachesRequest } = await octokit.rest.actions.getActionsCacheList({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    per_page: 100
  });

  const cacheToDelete = cachesRequest.actions_caches.find(cache => cache.key === cacheKey && cache.id !== undefined);

  if (!cacheToDelete) {
    core.warning(`No cache found with key ${cacheKey}.`);
    return;
  }

  try {
    await octokit.rest.actions.deleteActionsCacheById({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      cache_id: cacheToDelete.id!,
    });
    core.info(`Cache with key ${cacheKey} deleted successfully.`);
  } catch (error) {
    core.setFailed(`Failed to delete cache ${cacheKey};\n\n${error}`);
  }
}

run();

