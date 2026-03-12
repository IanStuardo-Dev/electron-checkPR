import type { PullRequestAiReview } from '../../../types/analysis';
import type { AttentionAlert, DashboardSummary, OperationalPullRequest } from './types';

export function enrichDashboardSummaryWithAi(
  summary: DashboardSummary,
  reviews: PullRequestAiReview[],
  configured: boolean,
): DashboardSummary {
  const reviewMap = new Map(reviews.map((review) => [review.pullRequestId, review]));
  const operationalPullRequests: OperationalPullRequest[] = summary.prioritizedPullRequests.map((pullRequest) => ({
    ...pullRequest,
    aiReview: reviewMap.get(pullRequest.id) || {
      pullRequestId: pullRequest.id,
      repository: pullRequest.repository,
      status: configured ? 'queued' : 'not-configured',
      topConcerns: [],
      reviewChecklist: [],
    },
  }));

  const aiCoverage = {
    analyzed: operationalPullRequests.filter((pr) => pr.aiReview.status === 'analyzed').length,
    eligible: configured ? operationalPullRequests.length : 0,
    highRisk: operationalPullRequests.filter((pr) => (pr.aiReview.riskScore ?? 0) >= 75).length,
    errored: operationalPullRequests.filter((pr) => pr.aiReview.status === 'error').length,
    omitted: operationalPullRequests.filter((pr) => pr.aiReview.status === 'omitted').length,
    configured,
  };

  const prAiSignals: AttentionAlert[] = configured
    ? [
      {
        id: 'ai-coverage',
        title: 'Cobertura IA de PRs',
        detail: `${aiCoverage.analyzed}/${aiCoverage.eligible} PRs priorizados fueron analizados con IA.`,
        tone: aiCoverage.analyzed === aiCoverage.eligible ? 'emerald' : 'sky',
      },
      {
        id: 'ai-high-risk',
        title: 'PRs con riesgo alto por IA',
        detail: `${aiCoverage.highRisk} PRs quedaron con score IA >= 75.`,
        tone: aiCoverage.highRisk > 0 ? 'amber' : 'emerald',
      },
      {
        id: 'ai-errors',
        title: 'Ejecuciones IA con problemas',
        detail: `${aiCoverage.errored} con error y ${aiCoverage.omitted} omitidos por política o sensibilidad.`,
        tone: aiCoverage.errored > 0 ? 'rose' : aiCoverage.omitted > 0 ? 'amber' : 'sky',
      },
    ]
    : [
      {
        id: 'ai-not-configured',
        title: 'PR AI Review deshabilitado',
        detail: 'Configura Codex en Settings para enriquecer la cola con resumen y score IA por PR.',
        tone: 'sky',
      },
    ];

  return {
    ...summary,
    operationalPullRequests,
    prAiSignals,
    aiCoverage,
  };
}
