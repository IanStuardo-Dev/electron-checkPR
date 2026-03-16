import type { PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, RepositoryConnectionConfig, ReviewItem } from '../../types/repository';
import { GITLAB_API_BASE_URL, getGitLabConfig, requestGitLabJson } from './gitlab.api';
import type { GitLabMergeRequestChangesResponse } from './gitlab.types';
import { buildPullRequestSnapshot } from '../shared/pull-request-snapshot';

function getChangeStatus(change: GitLabMergeRequestChangesResponse['changes'][number]): string {
  if (change.new_file) {
    return 'added';
  }
  if (change.deleted_file) {
    return 'removed';
  }
  if (change.renamed_file) {
    return 'renamed';
  }
  return 'modified';
}

export async function getGitLabPullRequestSnapshot(
  config: RepositoryConnectionConfig,
  pullRequest: ReviewItem,
  options: PullRequestSnapshotOptions,
): Promise<PullRequestSnapshot> {
  const { project, personalAccessToken } = getGitLabConfig({
    ...config,
    repositoryId: pullRequest.repository,
    project: pullRequest.repository,
  });

  const payload = await requestGitLabJson<GitLabMergeRequestChangesResponse>(
    `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/merge_requests/${pullRequest.id}/changes`,
    personalAccessToken,
    `merge request changes request (${project}!${pullRequest.id})`,
  );

  return buildPullRequestSnapshot({
    provider: 'gitlab',
    pullRequest,
    changes: payload.changes,
    snapshotOptions: options,
    getPath: (change) => change.new_path || change.old_path,
    mapFile: (change) => ({
      path: change.new_path || change.old_path,
      status: getChangeStatus(change),
      patch: change.diff,
    }),
    excludedLabel: 'merge request',
    missingPatchMessage: 'archivos del merge request no incluyen diff textual en la respuesta del provider.',
  });
}
