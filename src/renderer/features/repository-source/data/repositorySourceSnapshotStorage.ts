import type { ReviewItem } from '../../../../types/repository';
import { persistDashboardSnapshot } from '../../history';
import { buildRepositorySourceSnapshotRecord } from '../application/repositorySourcePersistence';
import type { SavedConnectionConfig } from '../types';

export function persistRepositorySourceHistorySnapshot(
  config: SavedConnectionConfig,
  result: ReviewItem[],
  snapshotTimestamp: Date,
  targetReviewer?: string,
): void {
  persistDashboardSnapshot(
    buildRepositorySourceSnapshotRecord(config, result, snapshotTimestamp, targetReviewer),
  );
}
