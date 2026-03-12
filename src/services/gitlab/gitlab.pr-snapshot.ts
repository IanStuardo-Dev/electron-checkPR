import type { PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, RepositoryConnectionConfig, ReviewItem } from '../../types/repository';
import { GITLAB_API_BASE_URL, getGitLabConfig, requestGitLabJson } from './gitlab.api';
import type { GitLabMergeRequestChangesResponse } from './gitlab.types';
import { shouldExcludeSnapshotPath } from '../shared/repository-snapshot-helpers';

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

  const visibleFiles = payload.changes
    .filter((change) => !shouldExcludeSnapshotPath(change.new_path || change.old_path, options.excludedPathPatterns))
    .map((change) => ({
      path: change.new_path || change.old_path,
      status: getChangeStatus(change),
      patch: change.diff,
    }));

  return {
    provider: 'gitlab',
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
    totalFilesChanged: payload.changes.length,
    truncated: payload.changes.length !== visibleFiles.length,
    partialReason: payload.changes.length !== visibleFiles.length
      ? `Se excluyeron ${payload.changes.length - visibleFiles.length} archivos del merge request por las reglas de snapshot configuradas.`
      : undefined,
  };
}
