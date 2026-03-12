import type { AzureConnectionConfig } from '../../types/azure';
import type { RepositorySnapshot } from '../../types/analysis';
import type { RepositorySnapshotOptions } from '../../types/repository';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import { isSupportedCodeFile, isTestFile, rankPath, shouldExcludeSnapshotPath } from '../shared/repository-snapshot-helpers';
import { appendPartialReason, isProbablyBinaryContent, MAX_SNAPSHOT_FILE_BYTES } from '../shared/snapshot-content';
import { AZURE_API_VERSION, getAzureConfig, requestAzureJson, requestAzureText } from './azure.api';
import type { AzureItemsResponse } from './azure.types';

export async function getAzureRepositorySnapshot(
  config: AzureConnectionConfig,
  options: RepositorySnapshotOptions,
): Promise<RepositorySnapshot> {
  const startedAt = Date.now();
  const { organization, project, personalAccessToken } = getAzureConfig(config);
  const repositoryId = config.repositoryId?.trim();

  if (!organization || !project || !personalAccessToken || !repositoryId) {
    throw new Error('Organization, project, repository, and personal access token are required.');
  }

  const itemsUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?scopePath=/&recursionLevel=Full&includeContentMetadata=true&versionDescriptor.version=${encodeURIComponent(options.branchName)}&versionDescriptor.versionType=branch&api-version=${AZURE_API_VERSION}`;
  const payload = await requestAzureJson<AzureItemsResponse>(itemsUrl, personalAccessToken, 'repository items request');

  const candidateFiles = payload.value
    .filter((item) => !item.isFolder && item.path)
    .filter((item) => isSupportedCodeFile(item.path))
    .filter((item) => options.includeTests || !isTestFile(item.path))
    .filter((item) => !shouldExcludeSnapshotPath(item.path, options.excludedPathPatterns))
    .sort((left, right) => rankPath(right.path) - rankPath(left.path) || left.path.localeCompare(right.path));

  const selectedFiles = candidateFiles.slice(0, options.maxFiles);
  let retryCount = 0;
  let skippedLargeFiles = 0;
  let skippedBinaryFiles = 0;
  const oversizedPaths: string[] = [];
  const binaryPaths: string[] = [];
  const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
    const contentUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?path=${encodeURIComponent(file.path)}&versionDescriptor.version=${encodeURIComponent(options.branchName)}&versionDescriptor.versionType=branch&download=false&resolveLfs=true&api-version=${AZURE_API_VERSION}`;
    const content = await retryWithBackoff(
      () => requestAzureText(contentUrl, personalAccessToken, `item content request (${file.path})`),
      {
        onRetry: () => {
          retryCount += 1;
        },
      },
    );

    if (Buffer.byteLength(content, 'utf8') > MAX_SNAPSHOT_FILE_BYTES) {
      skippedLargeFiles += 1;
      if (oversizedPaths.length < 8) {
        oversizedPaths.push(file.path.replace(/^\//, ''));
      }
      return null;
    }

    if (isProbablyBinaryContent(content)) {
      skippedBinaryFiles += 1;
      if (binaryPaths.length < 8) {
        binaryPaths.push(file.path.replace(/^\//, ''));
      }
      return null;
    }

    return {
      path: file.path.replace(/^\//, ''),
      extension: file.path.split('.').pop()?.toLowerCase() || '',
      size: content.length,
      content,
    };
  })).filter((file) => file !== null);

  const partialReason = appendPartialReason(
    candidateFiles.length > options.maxFiles
      ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos en Azure DevOps.`
      : undefined,
    [
      skippedLargeFiles > 0 ? `Se omitieron ${skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.` : '',
      skippedBinaryFiles > 0 ? `Se omitieron ${skippedBinaryFiles} archivos por contenido binario o no legible.` : '',
    ],
  );

  return {
    provider: 'azure-devops',
    repository: repositoryId,
    branch: options.branchName,
    files,
    totalFilesDiscovered: candidateFiles.length,
    truncated: candidateFiles.length > options.maxFiles || skippedLargeFiles > 0 || skippedBinaryFiles > 0,
    partialReason,
    exclusions: {
      omittedByPrioritization: candidateFiles.slice(options.maxFiles, options.maxFiles + 8).map((file) => file.path.replace(/^\//, '')),
      omittedBySize: oversizedPaths,
      omittedByBinaryDetection: binaryPaths,
    },
    metrics: {
      durationMs: Date.now() - startedAt,
      retryCount,
      discardedByPrioritization: Math.max(0, candidateFiles.length - selectedFiles.length),
      discardedBySize: skippedLargeFiles,
      discardedByBinaryDetection: skippedBinaryFiles,
    },
  };
}
