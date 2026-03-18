import type { ReviewItem } from '../../../../types/repository';
import { persistDashboardSnapshot } from '../../history';
import { buildDashboardSummary } from '../../../shared/dashboard/summary';
import { buildScopeLabel } from './repositorySourceDiagnostics';
import type { SavedConnectionConfig } from '../types';

export function persistRepositorySourceSnapshot(
  config: SavedConnectionConfig,
  result: ReviewItem[],
  snapshotTimestamp: Date,
  targetReviewer?: string,
): void {
  const effectiveScopeLabel = buildScopeLabel(config, null, null);
  const snapshotSummary = buildDashboardSummary(result, snapshotTimestamp, effectiveScopeLabel, targetReviewer);

  persistDashboardSnapshot({
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
  });
}
