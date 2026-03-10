import React from 'react';
import { motion } from 'framer-motion';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import DashboardHero from '../features/dashboard/components/DashboardHero';
import GovernanceAlerts from '../features/dashboard/components/GovernanceAlerts';
import HealthSection from '../features/dashboard/components/HealthSection';
import InsightsPanel from '../features/dashboard/components/InsightsPanel';
import MetricsGrid from '../features/dashboard/components/MetricsGrid';
import PriorityList from '../features/dashboard/components/PriorityList';
import { useRepositorySource } from '../features/dashboard/hooks/useAzurePullRequests';

const Dashboard = () => {
  const {
    activeProvider,
    isConnectionReady,
    selectedProjectName,
    summary,
    openPullRequest,
    selectedRepositoryName,
  } = useRepositorySource();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <DashboardHero
        providerName={activeProvider.name}
        lastUpdatedLabel={summary.lastUpdatedLabel}
        scopeLabel={summary.scopeLabel}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <ConnectionSummary
          providerKind={activeProvider.kind}
          providerName={activeProvider.name}
          scopeLabel={summary.scopeLabel}
          projectName={selectedProjectName}
          repositoryName={selectedRepositoryName}
          isConnected={isConnectionReady}
          showAction={false}
        />
        {isConnectionReady ? (
          <MetricsGrid metrics={summary.metrics} />
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-lg ring-1 ring-slate-200">
            Conecta una fuente de repositorios desde Settings para visualizar metricas, backlog y tendencias. Hoy el provider operativo es {activeProvider.name}.
          </section>
        )}
      </section>

      {isConnectionReady ? (
        <>
          <HealthSection
            title="Salud de entrega"
            description="Mide si el flujo de PRs está avanzando o se está quedando en cola."
            indicators={summary.deliveryIndicators}
          />

          <HealthSection
            title="Eficiencia de review"
            description="Expone cobertura, carga pendiente y posibles cuellos de botella."
            indicators={summary.reviewIndicators}
          />

          <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <PriorityList
              pullRequests={summary.prioritizedPullRequests}
              onOpenPullRequest={(url) => void openPullRequest(url)}
            />
            <InsightsPanel
              repositoryInsights={summary.repositoryInsights}
              branchInsights={summary.branchInsights}
              reviewerInsights={summary.reviewerInsights}
              noDescriptionCount={summary.noDescriptionCount}
            />
          </section>

          <GovernanceAlerts alerts={summary.governanceAlerts} />
        </>
      ) : null}
    </motion.div>
  );
};

export default Dashboard;
