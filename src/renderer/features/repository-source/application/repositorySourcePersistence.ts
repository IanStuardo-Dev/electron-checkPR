import type { ReviewItem } from '../../../../types/repository';
import { buildDashboardSummary } from '../../../shared/dashboard/summary';
import { buildScopeLabel } from './repositorySourceDiagnostics';
import type { SavedConnectionConfig } from '../types';

export interface RepositorySourceSnapshotRecord {
  id: string;
  capturedAt: string;
  scopeLabel: string;
  activePRs: number;
  highRiskPRs: number;
  blockedPRs: number;
  reviewBacklog: number;
  averageAgeHours: number;
  stalePRs: number;
  repositoryCount: number;
  hotfixPRs: number;
}

export function buildRepositorySourceSnapshotRecord(
  config: SavedConnectionConfig,
  result: ReviewItem[],
  snapshotTimestamp: Date,
  targetReviewer?: string,
): RepositorySourceSnapshotRecord {
  const effectiveScopeLabel = buildScopeLabel(config, null, null);
  const snapshotSummary = buildDashboardSummary(result, snapshotTimestamp, effectiveScopeLabel, targetReviewer);

  return {
    id: `${snapshotTimestamp.toISOString()}-${effectiveScopeLabel}`,
    capturedAt: snapshotTimestamp.toISOString(),
    scopeLabel: effectiveScopeLabel,
    activePRs: snapshotSummary.activePRs,
    highRiskPRs: snapshotSummary.highRiskPRs,
    blockedPRs: snapshotSummary.blockedPRs,
    reviewBacklog: snapshotSummary.reviewBacklog,
    averageAgeHours: snapshotSummary.averageAgeHours,
    stalePRs: snapshotSummary.stalePRs,
    repositoryCount: snapshotSummary.repositoryCount,
    hotfixPRs: snapshotSummary.hotfixPRs,
  };
}
