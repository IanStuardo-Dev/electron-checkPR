import type { RepositoryConnectionConfig, RepositorySnapshotOptions } from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import {
  buildRepositoryFileSnapshot,
  buildRepositorySnapshot,
  createRepositorySnapshotCollectionState,
  getPrioritizedSnapshotPaths,
  selectRepositorySnapshotCandidates,
} from '../shared/repository-snapshot';
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

  const candidateFiles = selectRepositorySnapshotCandidates(
    tree.filter((item) => item.type === 'blob'),
    options,
  );

  const selectedFiles = candidateFiles.slice(0, options.maxFiles);
  const collectionState = createRepositorySnapshotCollectionState();
  const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
    const payload = await retryWithBackoff(() => requestGitLabJson<GitLabFileResponse>(
      `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/files/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(options.branchName)}`,
      personalAccessToken,
      `file request (${file.path})`,
    ), {
      onRetry: () => {
        collectionState.retryCount += 1;
      },
    });

    const content = payload.encoding === 'base64'
      ? Buffer.from(payload.content, 'base64').toString('utf8')
      : payload.content;

    return buildRepositoryFileSnapshot(
      payload.file_path,
      content,
      payload.size,
      collectionState,
    );
  })).filter((file) => file !== null);

  return buildRepositorySnapshot({
    provider: 'gitlab',
    repository: project,
    branchName: options.branchName,
    files,
    totalFilesDiscovered: candidateFiles.length,
    maxFiles: options.maxFiles,
    startedAt,
    collectionState,
    prioritizedPaths: getPrioritizedSnapshotPaths(candidateFiles, options.maxFiles),
    basePartialReason: candidateFiles.length > options.maxFiles
      ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos en GitLab.`
      : undefined,
  });
}
