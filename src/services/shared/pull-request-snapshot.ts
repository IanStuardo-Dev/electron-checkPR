import type { PullRequestChangedFileSnapshot, PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, ReviewItem } from '../../types/repository';
import { appendPartialReason } from './snapshot-content';
import { shouldExcludeSnapshotPath } from './repository-snapshot-helpers';

interface BuildPullRequestSnapshotOptions<TChange, TFile extends PullRequestChangedFileSnapshot> {
  provider: PullRequestSnapshot['provider'];
  pullRequest: ReviewItem;
  changes: TChange[];
  snapshotOptions: PullRequestSnapshotOptions;
  getPath: (change: TChange) => string;
  mapFile: (change: TChange) => TFile;
  excludedLabel: string;
  missingPatchMessage: string;
}

export function buildPullRequestSnapshot<TChange, TFile extends PullRequestChangedFileSnapshot>({
  provider,
  pullRequest,
  changes,
  snapshotOptions,
  getPath,
  mapFile,
  excludedLabel,
  missingPatchMessage,
}: BuildPullRequestSnapshotOptions<TChange, TFile>): PullRequestSnapshot {
  const visibleFiles = changes
    .filter((change) => !shouldExcludeSnapshotPath(getPath(change), snapshotOptions.excludedPathPatterns))
    .map(mapFile);
  const excludedCount = changes.length - visibleFiles.length;
  const filesWithoutPatch = visibleFiles.filter((file) => !file.patch).length;

  return {
    provider,
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
    totalFilesChanged: changes.length,
    truncated: changes.length !== visibleFiles.length,
    partialReason: appendPartialReason(undefined, [
      excludedCount > 0
        ? `Se excluyeron ${excludedCount} archivos del ${excludedLabel} por las reglas de snapshot configuradas.`
        : '',
      filesWithoutPatch > 0
        ? `${filesWithoutPatch} ${missingPatchMessage}`
        : '',
    ]),
  };
}
