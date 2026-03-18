import React from 'react';
import type { ReviewItem } from '../../../../../types/repository';
import { persistRepositorySourceHistorySnapshot } from '../../data/repositorySourceSnapshotStorage';
import type { SavedConnectionConfig } from '../../types';

export function useRepositorySourceSnapshotPersistence(
  configRef: React.MutableRefObject<SavedConnectionConfig>,
) {
  return React.useCallback((
    result: ReviewItem[],
    snapshotTimestamp: Date,
    _scopeLabel: string,
    targetReviewer?: string,
  ) => {
    persistRepositorySourceHistorySnapshot(configRef.current, result, snapshotTimestamp, targetReviewer);
  }, [configRef]);
}
