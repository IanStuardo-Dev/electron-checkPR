import type { RepositoryConnectionConfig, RepositorySnapshotOptions } from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';
import { mapWithConcurrency, retryWithBackoff } from '../../shared/request-control';
import { rankPath } from '../shared/repository-snapshot-helpers';
import { getGitHubConfig, requestGitHubContent, requestGitHubJson } from './github.api';
import type { GitHubTreeResponse } from './github.types';
import {
  buildRepositoryFileSnapshot,
  buildRepositorySnapshot,
  createRepositorySnapshotCollectionState,
  getPrioritizedSnapshotPaths,
  skipRepositorySnapshotFileBySize,
  selectRepositorySnapshotCandidates,
} from '../shared/repository-snapshot';

export async function enumerateGitHubContents(
  owner: string,
  repository: string,
  branchName: string,
  personalAccessToken: string,
  options: {
    inventoryTarget?: number;
    concurrency?: number;
  } = {},
): Promise<{
  files: Array<{ path: string; size?: number }>;
  reachedInventoryTarget: boolean;
}> {
  const queue = [''];
  const files: Array<{ path: string; size?: number }> = [];
  const inventoryTarget = options.inventoryTarget ?? Number.POSITIVE_INFINITY;
  const concurrency = Math.max(1, options.concurrency ?? 4);
  let cursor = 0;
  let reachedInventoryTarget = false;

  async function processDirectory(currentPath: string): Promise<void> {
    if (files.length >= inventoryTarget) {
      reachedInventoryTarget = true;
      return;
    }

    const pathSuffix = currentPath ? `/${currentPath.split('/').map(encodeURIComponent).join('/')}` : '';
    const payload = await retryWithBackoff(() => requestGitHubContent(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents${pathSuffix}?ref=${encodeURIComponent(branchName)}`,
      personalAccessToken,
      `repository contents request (${currentPath || '/'})`,
    ));
    if (Array.isArray(payload)) {
      payload.forEach((item) => {
        if (files.length >= inventoryTarget) {
          reachedInventoryTarget = true;
          return;
        }

        if (item.type === 'dir') {
          queue.push(item.path);
          return;
        }

        files.push({
          path: item.path,
          size: item.size,
        });
      });
    }
  }

  async function worker(): Promise<void> {
    while (cursor < queue.length && !reachedInventoryTarget) {
      const currentIndex = cursor;
      cursor += 1;
      await processDirectory(queue[currentIndex]);
    }
  }

  while (cursor < queue.length && !reachedInventoryTarget) {
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length - cursor) }, () => worker()));
  }

  return {
    files,
    reachedInventoryTarget,
  };
}

export async function getGitHubRepositorySnapshot(
  config: RepositoryConnectionConfig,
  options: RepositorySnapshotOptions,
): Promise<RepositorySnapshot> {
  const startedAt = Date.now();
  const { organization, personalAccessToken, repository } = getGitHubConfig({
    ...config,
    repositoryId: config.repositoryId || config.project,
  });

  if (!organization || !repository || !personalAccessToken) {
    throw new Error('Owner/organization, repository y token son obligatorios para GitHub.');
  }

  const tree = await requestGitHubJson<GitHubTreeResponse>(
    `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(options.branchName)}?recursive=1`,
    personalAccessToken,
    'repository tree request',
  );

  const treeFiles = tree.tree
    .filter((item) => item.type === 'blob' && item.path)
    .map((item) => ({
      path: item.path,
      size: item.size,
    }));

  const inventoryTarget = Math.max(options.maxFiles * 3, options.maxFiles + 25);
  const enumerated = tree.truncated
    ? await enumerateGitHubContents(organization, repository, options.branchName, personalAccessToken, {
      inventoryTarget,
      concurrency: 4,
    })
    : { files: treeFiles, reachedInventoryTarget: false };
  const discoveredFiles = enumerated.files;

  const candidateFiles = selectRepositorySnapshotCandidates(discoveredFiles, options, (left, right) => {
      const scoreDelta = rankPath(right.path) - rankPath(left.path);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return (left.size || 0) - (right.size || 0);
    });

  const selectedFiles = candidateFiles.slice(0, options.maxFiles);
  const collectionState = createRepositorySnapshotCollectionState();
  const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
    if (skipRepositorySnapshotFileBySize(file.path, file.size || 0, collectionState)) {
      return null;
    }

    const contentPayload = await retryWithBackoff(() => requestGitHubContent(
      `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/contents/${file.path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(options.branchName)}`,
      personalAccessToken,
      `content request (${file.path})`,
    ), {
      onRetry: () => {
        collectionState.retryCount += 1;
      },
    });

    if (Array.isArray(contentPayload) || contentPayload.type !== 'file') {
      throw new Error(`GitHub content request (${file.path}) returned a directory payload unexpectedly.`);
    }

    const content = contentPayload.encoding === 'base64'
      ? Buffer.from(contentPayload.content.replace(/\n/g, ''), 'base64').toString('utf8')
      : contentPayload.content;

    return buildRepositoryFileSnapshot(
      file.path,
      content,
      contentPayload.size,
      collectionState,
    );
  })).filter((file) => file !== null);

  return buildRepositorySnapshot({
    provider: 'github',
    repository,
    branchName: options.branchName,
    files,
    totalFilesDiscovered: candidateFiles.length,
    maxFiles: options.maxFiles,
    startedAt,
    collectionState,
    prioritizedPaths: getPrioritizedSnapshotPaths(candidateFiles, options.maxFiles),
    basePartialReason: tree.truncated
      ? `GitHub reporto el tree como truncado; se reconstruyo el inventario via contents${enumerated.reachedInventoryTarget ? ` con corte temprano al alcanzar ${inventoryTarget} archivos inventariados` : ''} y el analisis puede omitir archivos profundos o no textuales.`
      : candidateFiles.length > options.maxFiles
        ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos.`
        : undefined,
  });
}
