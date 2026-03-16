import React from 'react';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import DashboardHero from '../features/dashboard/components/DashboardHero';
import GovernanceAlerts from '../features/dashboard/components/GovernanceAlerts';
import HealthSection from '../features/dashboard/components/HealthSection';
import InsightsPanel from '../features/dashboard/components/InsightsPanel';
import MetricsGrid from '../features/dashboard/components/MetricsGrid';
import PriorityList from '../features/dashboard/components/PriorityList';
import ExecutiveSummaryPanel from '../features/dashboard/components/ExecutiveSummaryPanel';
import ReviewerWorkloadPanel from '../features/dashboard/components/ReviewerWorkloadPanel';
import PullRequestAiReviewModal from '../features/dashboard/components/PullRequestAiReviewModal';
import { useRepositorySourceContext } from '../features/dashboard/context/RepositorySourceContext';
import { useCodexSettings } from '../features/settings/hooks/useCodexSettings';
import { usePullRequestAiReviews } from '../features/dashboard/hooks/usePullRequestAiReviews';
import { enrichDashboardSummaryWithAi } from '../features/dashboard/pullRequestAiSummary';

const Dashboard = () => {
  const {
    activeProvider,
    activeProviderName,
    config,
    isConnectionReady,
    selectedProjectName,
    summary,
    openPullRequest,
    selectedRepositoryName,
  } = useRepositorySourceContext();
  const { config: codexConfig } = useCodexSettings();
  const {
    reviews,
    isConfigured: isAiConfigured,
    openPriorityQueueReview,
    openPullRequestReview,
    isPreviewing,
    isSubmitting,
    isModalOpen,
    modalError,
    modalPreviews,
    selectedPullRequests,
    snapshotAcknowledged,
    setSnapshotAcknowledged,
    eligiblePullRequests,
    runSelectedPullRequests,
    cancelRunningAnalysis,
    closeModal,
  } = usePullRequestAiReviews({
    config,
    pullRequests: summary.prioritizedPullRequests,
    isConnectionReady,
    codexConfig,
  });
  const dashboardSummary = React.useMemo(
    () => enrichDashboardSummaryWithAi(summary, reviews, isAiConfigured),
    [isAiConfigured, reviews, summary],
  );

  return (
    <div className="space-y-6">
      <DashboardHero
        providerName={activeProviderName}
        lastUpdatedLabel={summary.lastUpdatedLabel}
        scopeLabel={summary.scopeLabel}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <ConnectionSummary
          providerKind={activeProvider?.kind}
          providerName={activeProviderName}
          scopeLabel={dashboardSummary.scopeLabel}
          projectName={selectedProjectName}
          repositoryName={selectedRepositoryName}
          isConnected={isConnectionReady}
          empty={!config.provider}
          showAction={false}
        />
        {!config.provider ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-lg ring-1 ring-slate-200">
            No hay provider activo. Ve a Settings y elige Azure DevOps, GitHub o GitLab antes de cargar metricas.
          </section>
        ) : isConnectionReady ? (
          <MetricsGrid metrics={dashboardSummary.queueMetrics} />
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-lg ring-1 ring-slate-200">
            Conecta la fuente seleccionada desde Settings para visualizar metricas, backlog y tendencias.
          </section>
        )}
      </section>

      {config.provider && isConnectionReady ? (
        <>
          <ExecutiveSummaryPanel
            metrics={dashboardSummary.executiveMetrics}
            alerts={dashboardSummary.prAiSignals}
          />

          <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <PriorityList
              pullRequests={dashboardSummary.operationalPullRequests}
              onOpenPullRequest={(url) => void openPullRequest(url)}
              onPreviewQueueAi={() => void openPriorityQueueReview()}
              onPreviewPullRequestAi={(pullRequestId) => void openPullRequestReview(pullRequestId)}
              isAiConfigured={isAiConfigured}
              isPreviewingAi={isPreviewing}
              isSubmittingAi={isSubmitting}
            />
            <ReviewerWorkloadPanel reviewers={dashboardSummary.reviewerWorkload} />
          </section>

          <HealthSection
            title="Salud de entrega"
            description="Mide si el flujo de PRs está avanzando o se está quedando en cola."
            indicators={dashboardSummary.deliveryIndicators}
          />

          <HealthSection
            title="Eficiencia de review"
            description="Expone cobertura, carga pendiente y posibles cuellos de botella."
            indicators={dashboardSummary.reviewIndicators}
          />

          <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <InsightsPanel
              repositoryInsights={dashboardSummary.repositoryInsights}
              branchInsights={dashboardSummary.branchInsights}
              reviewerInsights={dashboardSummary.reviewerInsights}
              noDescriptionCount={dashboardSummary.noDescriptionCount}
            />
            <GovernanceAlerts alerts={dashboardSummary.governanceAlerts} />
          </section>
        </>
      ) : null}

      <PullRequestAiReviewModal
        isOpen={isModalOpen}
        previews={modalPreviews}
        selectedPullRequests={selectedPullRequests}
        snapshotAcknowledged={snapshotAcknowledged}
        onToggleAcknowledgement={setSnapshotAcknowledged}
        onClose={closeModal}
        onConfirm={() => void runSelectedPullRequests()}
        onCancel={() => void cancelRunningAnalysis()}
        isPreviewing={isPreviewing}
        isSubmitting={isSubmitting}
        error={modalError}
        canConfirm={snapshotAcknowledged && eligiblePullRequests.length > 0}
      />
    </div>
  );
};

export default Dashboard;
