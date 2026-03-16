import type { PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, ReviewItem } from '../../types/repository';
import type { AzureConnectionConfig } from '../../types/azure';
import { AZURE_API_VERSION, getAzureConfig, requestAzureJson } from './azure.api';
import type { AzurePullRequestChangesResponse, AzurePullRequestIterationsResponse } from './azure.types';
import { buildPullRequestSnapshot } from '../shared/pull-request-snapshot';

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

  return buildPullRequestSnapshot({
    provider: 'azure-devops',
    pullRequest,
    changes: changes.changeEntries.filter((entry) => entry.item?.path),
    snapshotOptions: options,
    getPath: (entry) => entry.item?.path || '',
    mapFile: (entry) => ({
      path: entry.item?.path?.replace(/^\//, '') || '',
      status: entry.changeType || 'modified',
    }),
    excludedLabel: 'Pull Request',
    missingPatchMessage: 'archivos del Pull Request no incluyen patch textual porque Azure DevOps no entrego patch textual y solo entrego metadata de cambios.',
  });
}
