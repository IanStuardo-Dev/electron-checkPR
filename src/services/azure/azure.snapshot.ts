import type { AzureConnectionConfig } from '../../types/azure';
import type { RepositorySnapshot } from '../../types/analysis';
import type { RepositorySnapshotOptions } from '../../types/repository';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import {
  buildRepositoryFileSnapshot,
  buildRepositorySnapshot,
  createRepositorySnapshotCollectionState,
  getPrioritizedSnapshotPaths,
  selectRepositorySnapshotCandidates,
} from '../shared/repository-snapshot';
import { AZURE_API_VERSION, requestAzureJson, requestAzureText } from './azure.api';
import { getRequiredAzureRepositoryContext } from './azure.context';
import type { AzureItemsResponse } from './azure.types';

export async function getAzureRepositorySnapshot(
  config: AzureConnectionConfig,
  options: RepositorySnapshotOptions,
): Promise<RepositorySnapshot> {
  const startedAt = Date.now();
  const { organization, project, personalAccessToken, repositoryId } = getRequiredAzureRepositoryContext(config);

  const itemsUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?scopePath=/&recursionLevel=Full&includeContentMetadata=true&versionDescriptor.version=${encodeURIComponent(options.branchName)}&versionDescriptor.versionType=branch&api-version=${AZURE_API_VERSION}`;
  const payload = await requestAzureJson<AzureItemsResponse>(itemsUrl, personalAccessToken, 'repository items request');

  const candidateFiles = selectRepositorySnapshotCandidates(
    payload.value.filter((item) => !item.isFolder && item.path),
    options,
  );

  const selectedFiles = candidateFiles.slice(0, options.maxFiles);
  const collectionState = createRepositorySnapshotCollectionState();
  const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
    const contentUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?path=${encodeURIComponent(file.path)}&versionDescriptor.version=${encodeURIComponent(options.branchName)}&versionDescriptor.versionType=branch&download=false&resolveLfs=true&api-version=${AZURE_API_VERSION}`;
    const content = await retryWithBackoff(
      () => requestAzureText(contentUrl, personalAccessToken, `item content request (${file.path})`),
      {
        onRetry: () => {
          collectionState.retryCount += 1;
        },
      },
    );

    return buildRepositoryFileSnapshot(
      file.path,
      content,
      Buffer.byteLength(content, 'utf8'),
      collectionState,
      {
        normalizePath: (path) => path.replace(/^\//, ''),
      },
    );
  })).filter((file) => file !== null);

  return buildRepositorySnapshot({
    provider: 'azure-devops',
    repository: repositoryId,
    branchName: options.branchName,
    files,
    totalFilesDiscovered: candidateFiles.length,
    maxFiles: options.maxFiles,
    startedAt,
    collectionState,
    prioritizedPaths: getPrioritizedSnapshotPaths(candidateFiles, options.maxFiles, (path) => path.replace(/^\//, '')),
    basePartialReason: candidateFiles.length > options.maxFiles
      ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos en Azure DevOps.`
      : undefined,
  });
}
