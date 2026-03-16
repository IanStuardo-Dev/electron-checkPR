export { loadDashboardHistory, persistDashboardSnapshot } from './data/historyStorage';
export async function loadHistoryCharts() {
  return import('./presentation/components/HistoryCharts');
}
