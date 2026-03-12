import type { PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, ReviewItem } from '../../types/repository';
import type { AzureConnectionConfig } from '../../types/azure';
import { AZURE_API_VERSION, getAzureConfig, requestAzureJson } from './azure.api';
import type { AzurePullRequestChangesResponse, AzurePullRequestIterationsResponse } from './azure.types';
import { shouldExcludeSnapshotPath } from '../shared/repository-snapshot-helpers';
import { appendPartialReason } from '../shared/snapshot-content';

export async function getAzurePullRequestSnapshot(
  config: AzureConnectionConfig,
  pullRequest: ReviewItem,
  options: PullRequestSnapshotOptions,
): Promise<PullRequestSnapshot> {
  const { organization, project, personalAccessToken } = getAzureConfig(config);
  const repositoryId = config.repositoryId?.trim() || pullRequest.repository;

  const iterations = await requestAzureJson<AzurePullRequestIterationsResponse>(
    `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/pullRequests/${pullRequest.id}/iterations?api-version=${AZURE_API_VERSION}`,
    personalAccessToken,
    `pull request iterations request (#${pullRequest.id})`,
  );

  const latestIterationId = iterations.value[iterations.value.length - 1]?.id;
  if (!latestIterationId) {
    throw new Error('No fue posible resolver la iteracion activa del Pull Request en Azure DevOps.');
  }

  const changes = await requestAzureJson<AzurePullRequestChangesResponse>(
    `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/pullRequests/${pullRequest.id}/iterations/${latestIterationId}/changes?api-version=${AZURE_API_VERSION}`,
    personalAccessToken,
    `pull request changes request (#${pullRequest.id})`,
  );

  const visibleFiles = changes.changeEntries
    .filter((entry) => entry.item?.path)
    .filter((entry) => !shouldExcludeSnapshotPath(entry.item!.path!, options.excludedPathPatterns))
    .map((entry) => ({
      path: entry.item!.path!.replace(/^\//, ''),
      status: entry.changeType || 'modified',
    }));

  const totalFilesChanged = changes.changeEntries.filter((entry) => entry.item?.path).length;
  const excludedCount = totalFilesChanged - visibleFiles.length;

  return {
    provider: 'azure-devops',
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
    totalFilesChanged,
    truncated: totalFilesChanged !== visibleFiles.length,
    partialReason: appendPartialReason(undefined, [
      excludedCount > 0
        ? `Se excluyeron ${excludedCount} archivos del Pull Request por las reglas de snapshot configuradas.`
        : '',
      visibleFiles.length > 0
        ? 'Azure DevOps no entrego patch textual para este PR; el snapshot contiene solo metadata de archivos cambiados.'
        : '',
    ]),
  };
}
