export interface DashboardHistorySnapshot {
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

const HISTORY_STORAGE_KEY = 'checkpr.dashboard.history';
const MAX_SNAPSHOTS = 120;

export function loadDashboardHistory(): DashboardHistorySnapshot[] {
  try {
    const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) {
      return [];
    }

    return JSON.parse(saved) as DashboardHistorySnapshot[];
  } catch {
    return [];
  }
}

export function persistDashboardSnapshot(snapshot: DashboardHistorySnapshot): void {
  const history = loadDashboardHistory();
  const nextHistory = [snapshot, ...history].slice(0, MAX_SNAPSHOTS);
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
}
