import type { PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, RepositoryConnectionConfig, ReviewItem } from '../../types/repository';
import { getGitHubConfig, requestGitHubPaginated } from './github.api';
import type { GitHubPullRequestFileResponseItem } from './github.types';
import { shouldExcludeSnapshotPath } from '../shared/repository-snapshot-helpers';

export async function getGitHubPullRequestSnapshot(
  config: RepositoryConnectionConfig,
  pullRequest: ReviewItem,
  options: PullRequestSnapshotOptions,
): Promise<PullRequestSnapshot> {
  const { organization, personalAccessToken } = getGitHubConfig({
    ...config,
    repositoryId: pullRequest.repository,
    project: pullRequest.repository,
  });

  const files = await requestGitHubPaginated<GitHubPullRequestFileResponseItem>(
    `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(pullRequest.repository)}/pulls/${pullRequest.id}/files?per_page=100`,
    personalAccessToken,
    `pull request files request (#${pullRequest.id})`,
  );

  const visibleFiles = files
    .filter((file) => !shouldExcludeSnapshotPath(file.filename, options.excludedPathPatterns))
    .map((file) => ({
      path: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    }));

  return {
    provider: 'github',
    repository: pullRequest.repository,
    pullRequestId: pullRequest.id,
    title: pullRequest.title,
    description: pullRequest.description,
    author: pullRequest.createdBy.displayName,
    sourceBranch: pullRequest.sourceBranch,
    targetBranch: pullRequest.targetBranch,
    reviewers: pullRequest.reviewers.map((reviewer) => ({
      displayName: reviewer.displayName,
      vote: reviewer.vote,
      isRequired: reviewer.isRequired,
    })),
    files: visibleFiles,
    totalFilesChanged: files.length,
    truncated: files.length !== visibleFiles.length,
    partialReason: files.length !== visibleFiles.length
      ? `Se excluyeron ${files.length - visibleFiles.length} archivos del PR por las reglas de snapshot configuradas.`
      : undefined,
  };
}
