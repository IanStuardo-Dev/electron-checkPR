import type { RepositorySnapshot } from '../../types/analysis';
import { appendPartialReason, MAX_SNAPSHOT_FILE_BYTES } from './snapshot-content';

interface BuildRepositorySnapshotOptions {
  provider: RepositorySnapshot['provider'];
  repository: string;
  branchName: string;
  files: RepositorySnapshot['files'];
  totalFilesDiscovered: number;
  maxFiles: number;
  startedAt: number;
  retryCount: number;
  skippedLargeFiles: number;
  skippedBinaryFiles: number;
  oversizedPaths: string[];
  binaryPaths: string[];
  prioritizedPaths: string[];
  basePartialReason?: string;
}

export function buildRepositorySnapshot({
  provider,
  repository,
  branchName,
  files,
  totalFilesDiscovered,
  maxFiles,
  startedAt,
  retryCount,
  skippedLargeFiles,
  skippedBinaryFiles,
  oversizedPaths,
  binaryPaths,
  prioritizedPaths,
  basePartialReason,
}: BuildRepositorySnapshotOptions): RepositorySnapshot {
  return {
    provider,
    repository,
    branch: branchName,
    files,
    totalFilesDiscovered,
    truncated: totalFilesDiscovered > maxFiles || skippedLargeFiles > 0 || skippedBinaryFiles > 0 || Boolean(basePartialReason),
    partialReason: appendPartialReason(basePartialReason, [
      skippedLargeFiles > 0 ? `Se omitieron ${skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.` : '',
      skippedBinaryFiles > 0 ? `Se omitieron ${skippedBinaryFiles} archivos por contenido binario o no legible.` : '',
    ]),
    exclusions: {
      omittedByPrioritization: prioritizedPaths,
      omittedBySize: oversizedPaths,
      omittedByBinaryDetection: binaryPaths,
    },
    metrics: {
      durationMs: Date.now() - startedAt,
      retryCount,
      discardedByPrioritization: Math.max(0, totalFilesDiscovered - Math.min(totalFilesDiscovered, maxFiles)),
      discardedBySize: skippedLargeFiles,
      discardedByBinaryDetection: skippedBinaryFiles,
    },
  };
}
