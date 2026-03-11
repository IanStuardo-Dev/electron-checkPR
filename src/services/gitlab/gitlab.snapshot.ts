import type { RepositoryConnectionConfig, RepositorySnapshotOptions } from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import { isSupportedCodeFile, isTestFile, rankPath } from '../shared/repository-snapshot-helpers';
import { appendPartialReason, isProbablyBinaryContent, MAX_SNAPSHOT_FILE_BYTES } from '../shared/snapshot-content';
import { GITLAB_API_BASE_URL, getGitLabConfig, requestGitLabJson, requestPaginatedGitLabTree } from './gitlab.api';
import type { GitLabFileResponse, GitLabTreeItemResponse } from './gitlab.types';

export async function getGitLabRepositorySnapshot(
  config: RepositoryConnectionConfig,
  options: RepositorySnapshotOptions,
): Promise<RepositorySnapshot> {
  const startedAt = Date.now();
  const { personalAccessToken, project } = getGitLabConfig({
    ...config,
    repositoryId: config.repositoryId || config.project,
  });

  if (!project || !personalAccessToken) {
    throw new Error('Proyecto y token son obligatorios para GitLab.');
  }

  const tree = await requestPaginatedGitLabTree<GitLabTreeItemResponse>(project, options.branchName, personalAccessToken);

  const candidateFiles = tree
    .filter((item) => item.type === 'blob')
    .filter((item) => isSupportedCodeFile(item.path))
    .filter((item) => options.includeTests || !isTestFile(item.path))
    .sort((left, right) => rankPath(right.path) - rankPath(left.path) || left.path.localeCompare(right.path));

  const selectedFiles = candidateFiles.slice(0, options.maxFiles);
  let retryCount = 0;
  let skippedLargeFiles = 0;
  let skippedBinaryFiles = 0;
  const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
    const payload = await retryWithBackoff(() => requestGitLabJson<GitLabFileResponse>(
      `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/files/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(options.branchName)}`,
      personalAccessToken,
      `file request (${file.path})`,
    ), {
      onRetry: () => {
        retryCount += 1;
      },
    });

    if (payload.size > MAX_SNAPSHOT_FILE_BYTES) {
      skippedLargeFiles += 1;
      return null;
    }

    const content = payload.encoding === 'base64'
      ? Buffer.from(payload.content, 'base64').toString('utf8')
      : payload.content;

    if (isProbablyBinaryContent(content)) {
      skippedBinaryFiles += 1;
      return null;
    }

    return {
      path: payload.file_path,
      extension: payload.file_path.split('.').pop()?.toLowerCase() || '',
      size: payload.size,
      content,
    };
  })).filter((file) => file !== null);

  const partialReason = appendPartialReason(
    candidateFiles.length > options.maxFiles
      ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos en GitLab.`
      : undefined,
    [
      skippedLargeFiles > 0 ? `Se omitieron ${skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.` : '',
      skippedBinaryFiles > 0 ? `Se omitieron ${skippedBinaryFiles} archivos por contenido binario o no legible.` : '',
    ],
  );

  return {
    provider: 'gitlab',
    repository: project,
    branch: options.branchName,
    files,
    totalFilesDiscovered: candidateFiles.length,
    truncated: candidateFiles.length > options.maxFiles || skippedLargeFiles > 0 || skippedBinaryFiles > 0,
    partialReason,
    metrics: {
      durationMs: Date.now() - startedAt,
      retryCount,
      discardedByPrioritization: Math.max(0, candidateFiles.length - selectedFiles.length),
      discardedBySize: skippedLargeFiles,
      discardedByBinaryDetection: skippedBinaryFiles,
    },
  };
}
