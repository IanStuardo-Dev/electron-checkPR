import type { RepositoryFileSnapshot, RepositorySnapshot } from '../../types/analysis';
import type { RepositorySnapshotOptions } from '../../types/repository';
import { isSupportedCodeFile, isTestFile, rankPath, shouldExcludeSnapshotPath } from './repository-snapshot-helpers';
import { appendPartialReason, isProbablyBinaryContent, MAX_SNAPSHOT_FILE_BYTES } from './snapshot-content';

export interface RepositorySnapshotCandidate {
  path: string;
  size?: number;
}

export interface RepositorySnapshotCollectionState {
  retryCount: number;
  skippedLargeFiles: number;
  skippedBinaryFiles: number;
  oversizedPaths: string[];
  binaryPaths: string[];
}

interface BuildRepositorySnapshotOptions {
  provider: RepositorySnapshot['provider'];
  repository: string;
  branchName: string;
  files: RepositorySnapshot['files'];
  totalFilesDiscovered: number;
  maxFiles: number;
  startedAt: number;
  collectionState: RepositorySnapshotCollectionState;
  prioritizedPaths: string[];
  basePartialReason?: string;
}

export function selectRepositorySnapshotCandidates<T extends RepositorySnapshotCandidate>(
  files: T[],
  options: RepositorySnapshotOptions,
  compareCandidates?: (left: T, right: T) => number,
): T[] {
  return files
    .filter((item) => isSupportedCodeFile(item.path))
    .filter((item) => options.includeTests || !isTestFile(item.path))
    .filter((item) => !shouldExcludeSnapshotPath(item.path, options.excludedPathPatterns))
    .sort(compareCandidates ?? ((left, right) => (
      rankPath(right.path) - rankPath(left.path) || left.path.localeCompare(right.path)
    )));
}

export function createRepositorySnapshotCollectionState(): RepositorySnapshotCollectionState {
  return {
    retryCount: 0,
    skippedLargeFiles: 0,
    skippedBinaryFiles: 0,
    oversizedPaths: [],
    binaryPaths: [],
  };
}

export function getPrioritizedSnapshotPaths<T extends RepositorySnapshotCandidate>(
  candidateFiles: T[],
  maxFiles: number,
  normalizePath: (path: string) => string = (path) => path,
): string[] {
  return candidateFiles
    .slice(maxFiles, maxFiles + 8)
    .map((file) => normalizePath(file.path));
}

function pushTrackedPath(paths: string[], path: string): void {
  if (paths.length < 8) {
    paths.push(path);
  }
}

export function buildRepositoryFileSnapshot(
  path: string,
  content: string,
  size: number,
  collectionState: RepositorySnapshotCollectionState,
  options: {
    normalizePath?: (path: string) => string;
  } = {},
): RepositoryFileSnapshot | null {
  const normalizePath = options.normalizePath ?? ((currentPath: string) => currentPath);
  const normalizedPath = normalizePath(path);

  if (size > MAX_SNAPSHOT_FILE_BYTES) {
    collectionState.skippedLargeFiles += 1;
    pushTrackedPath(collectionState.oversizedPaths, normalizedPath);
    return null;
  }

  if (isProbablyBinaryContent(content)) {
    collectionState.skippedBinaryFiles += 1;
    pushTrackedPath(collectionState.binaryPaths, normalizedPath);
    return null;
  }

  return {
    path: normalizedPath,
    extension: normalizedPath.split('.').pop()?.toLowerCase() || '',
    size,
    content,
  };
}

export function skipRepositorySnapshotFileBySize(
  path: string,
  size: number,
  collectionState: RepositorySnapshotCollectionState,
  options: {
    normalizePath?: (path: string) => string;
  } = {},
): boolean {
  const normalizePath = options.normalizePath ?? ((currentPath: string) => currentPath);
  const normalizedPath = normalizePath(path);

  if (size <= MAX_SNAPSHOT_FILE_BYTES) {
    return false;
  }

  collectionState.skippedLargeFiles += 1;
  pushTrackedPath(collectionState.oversizedPaths, normalizedPath);
  return true;
}

export function buildRepositorySnapshot({
  provider,
  repository,
  branchName,
  files,
  totalFilesDiscovered,
  maxFiles,
  startedAt,
  collectionState,
  prioritizedPaths,
  basePartialReason,
}: BuildRepositorySnapshotOptions): RepositorySnapshot {
  return {
    provider,
    repository,
    branch: branchName,
    files,
    totalFilesDiscovered,
    truncated: totalFilesDiscovered > maxFiles
      || collectionState.skippedLargeFiles > 0
      || collectionState.skippedBinaryFiles > 0
      || Boolean(basePartialReason),
    partialReason: appendPartialReason(basePartialReason, [
      collectionState.skippedLargeFiles > 0
        ? `Se omitieron ${collectionState.skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.`
        : '',
      collectionState.skippedBinaryFiles > 0
        ? `Se omitieron ${collectionState.skippedBinaryFiles} archivos por contenido binario o no legible.`
        : '',
    ]),
    exclusions: {
      omittedByPrioritization: prioritizedPaths,
      omittedBySize: collectionState.oversizedPaths,
      omittedByBinaryDetection: collectionState.binaryPaths,
    },
    metrics: {
      durationMs: Date.now() - startedAt,
      retryCount: collectionState.retryCount,
      discardedByPrioritization: Math.max(0, totalFilesDiscovered - Math.min(totalFilesDiscovered, maxFiles)),
      discardedBySize: collectionState.skippedLargeFiles,
      discardedByBinaryDetection: collectionState.skippedBinaryFiles,
    },
  };
}
