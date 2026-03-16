import React from 'react';
import type { ReviewItem } from '../../../../../types/repository';
import { persistRepositorySourceSnapshot } from '../../application/repositorySourcePersistence';
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
    persistRepositorySourceSnapshot(configRef.current, result, snapshotTimestamp, targetReviewer);
  }, [configRef]);
}
