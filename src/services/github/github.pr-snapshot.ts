import type { PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, RepositoryConnectionConfig, ReviewItem } from '../../types/repository';
import { getGitHubConfig, requestGitHubPaginated } from './github.api';
import type { GitHubPullRequestFileResponseItem } from './github.types';
import { buildPullRequestSnapshot } from '../shared/pull-request-snapshot';

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

  return buildPullRequestSnapshot({
    provider: 'github',
    pullRequest,
    changes: files,
    snapshotOptions: options,
    getPath: (file) => file.filename,
    mapFile: (file) => ({
      path: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    }),
    excludedLabel: 'PR',
    missingPatchMessage: 'archivos del PR no incluyen patch textual en la respuesta del provider.',
  });
}
