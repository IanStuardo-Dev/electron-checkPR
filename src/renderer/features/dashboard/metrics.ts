import type { PullRequest } from '../../../types/azure';
import type {
  AttentionAlert,
  BranchInsight,
  DashboardMetric,
  DashboardSummary,
  HealthIndicator,
  PrioritizedPullRequest,
  RepositoryInsight,
  ReviewerInsight,
} from './types';

function getAgeHours(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  return Math.max(0, Math.round((Date.now() - created) / (1000 * 60 * 60)));
}

function getApprovals(pr: PullRequest): number {
  return pr.reviewers.filter((reviewer) => reviewer.vote >= 5).length;
}

function getPendingReviewers(pr: PullRequest): number {
  return pr.reviewers.filter((reviewer) => reviewer.vote === 0).length;
}

function hasMergeConflict(pr: PullRequest): boolean {
  return pr.mergeStatus.toLowerCase().includes('conflict');
}

function hasEmptyDescription(pr: PullRequest): boolean {
  return !pr.description || pr.description === 'No description provided.';
}

function getRiskScore(pr: PullRequest): number {
  const ageHours = getAgeHours(pr.createdAt);
  const pendingReviewers = getPendingReviewers(pr);
  let score = 0;

  if (ageHours >= 72) {
    score += 3;
  } else if (ageHours >= 24) {
    score += 1;
  }

  if (hasMergeConflict(pr)) {
    score += 3;
  }

  if (!pr.isDraft && pendingReviewers >= 2) {
    score += 2;
  }

  if (hasEmptyDescription(pr)) {
    score += 1;
  }

  return score;
}

function prioritizePullRequests(pullRequests: PullRequest[]): PrioritizedPullRequest[] {
  return pullRequests
    .map((pr) => ({
      ...pr,
      ageHours: getAgeHours(pr.createdAt),
      approvals: getApprovals(pr),
      pendingReviewers: getPendingReviewers(pr),
      riskScore: getRiskScore(pr),
    }))
    .sort((left, right) => right.riskScore - left.riskScore || right.ageHours - left.ageHours);
}

function formatHours(hours: number): string {
  if (hours >= 24) {
    return `${(hours / 24).toFixed(1)}d`;
  }

  return `${hours}h`;
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

function buildMetrics(
  prioritizedPullRequests: PrioritizedPullRequest[],
  targetReviewer?: string,
): DashboardMetric[] {
  const activePRs = prioritizedPullRequests.length;
  const draftPRs = prioritizedPullRequests.filter((pr) => pr.isDraft).length;
  const blockedPRs = prioritizedPullRequests.filter(hasMergeConflict).length;
  const highRiskPRs = prioritizedPullRequests.filter((pr) => pr.riskScore >= 4).length;
  const repositoriesInReview = new Set(prioritizedPullRequests.map((pr) => pr.repository)).size;
  const averageAgeHours = activePRs === 0
    ? 0
    : Math.round(prioritizedPullRequests.reduce((sum, pr) => sum + pr.ageHours, 0) / activePRs);

  const reviewerWorkload = targetReviewer
    ? prioritizedPullRequests.filter((pr) =>
        pr.reviewers.some((reviewer) => {
          const target = targetReviewer.toLowerCase().trim();
          return reviewer.vote === 0 && (
            reviewer.displayName.toLowerCase().includes(target) ||
            reviewer.uniqueName?.toLowerCase().includes(target)
          );
        }),
      ).length
    : prioritizedPullRequests.filter((pr) => !pr.isDraft && pr.pendingReviewers > 0).length;

  return [
    {
      id: 'active-prs',
      title: 'PRs activos',
      value: activePRs,
      detail: 'Volumen actual para revisar',
      tone: 'sky',
    },
    {
      id: 'high-risk',
      title: 'PRs con riesgo',
      value: highRiskPRs,
      detail: 'Viejos, bloqueados o sin contexto',
      tone: 'amber',
    },
    {
      id: 'blocked',
      title: 'Bloqueados',
      value: blockedPRs,
      detail: 'Conflictos de merge detectados',
      tone: 'rose',
    },
    {
      id: 'reviewer-workload',
      title: targetReviewer ? 'Pendientes del reviewer' : 'Esperando review',
      value: reviewerWorkload,
      detail: targetReviewer ? `Backlog de ${targetReviewer}` : 'Listos para acción del equipo',
      tone: 'emerald',
    },
    {
      id: 'repositories',
      title: 'Repos impactados',
      value: repositoriesInReview,
      detail: 'Repositorios con PRs abiertos',
      tone: 'sky',
    },
    {
      id: 'average-age',
      title: 'Edad promedio',
      value: formatHours(averageAgeHours),
      detail: 'Tiempo medio en cola',
      tone: 'amber',
    },
    {
      id: 'drafts',
      title: 'Drafts',
      value: draftPRs,
      detail: 'PRs aún no listos para merge',
      tone: 'rose',
    },
    {
      id: 'approved',
      title: 'Con aprobación',
      value: prioritizedPullRequests.filter((pr) => pr.approvals > 0).length,
      detail: 'PRs con al menos un voto positivo',
      tone: 'emerald',
    },
  ];
}

function getAverageAgeHours(prioritizedPullRequests: PrioritizedPullRequest[]): number {
  if (prioritizedPullRequests.length === 0) {
    return 0;
  }

  return Math.round(
    prioritizedPullRequests.reduce((sum, pr) => sum + pr.ageHours, 0) / prioritizedPullRequests.length,
  );
}

function buildDeliveryIndicators(prioritizedPullRequests: PrioritizedPullRequest[]): HealthIndicator[] {
  const total = prioritizedPullRequests.length;
  const stale = countPullRequestsOlderThan(prioritizedPullRequests, 72);
  const averageAgeHours = total === 0
    ? 0
    : Math.round(prioritizedPullRequests.reduce((sum, pr) => sum + pr.ageHours, 0) / total);
  const mainlineTargeting = prioritizedPullRequests.filter((pr) =>
    ['main', 'master', 'develop'].includes(pr.targetBranch.toLowerCase()),
  ).length;
  const hotfixCount = prioritizedPullRequests.filter((pr) => pr.sourceBranch.startsWith('hotfix/')).length;

  return [
    {
      id: 'avg-age',
      title: 'Edad promedio',
      value: formatHours(averageAgeHours),
      description: 'Mide cuánto tarda la cola en moverse.',
      tone: averageAgeHours >= 72 ? 'rose' : averageAgeHours >= 36 ? 'amber' : 'emerald',
    },
    {
      id: 'stale-ratio',
      title: 'PRs stale',
      value: total === 0 ? '0%' : formatPercentage((stale / total) * 100),
      description: 'Porcentaje de PRs abiertos hace más de 72 horas.',
      tone: stale >= 5 ? 'rose' : stale >= 2 ? 'amber' : 'emerald',
    },
    {
      id: 'mainline-targeting',
      title: 'Apuntando a ramas core',
      value: total === 0 ? '0%' : formatPercentage((mainlineTargeting / total) * 100),
      description: 'PRs que afectan el flujo principal de entrega.',
      tone: mainlineTargeting >= Math.max(3, Math.ceil(total * 0.6)) ? 'amber' : 'sky',
    },
    {
      id: 'hotfix-pressure',
      title: 'Presión de hotfix',
      value: total === 0 ? '0%' : formatPercentage((hotfixCount / total) * 100),
      description: 'Señal temprana de trabajo reactivo sobre producción.',
      tone: hotfixCount >= 2 ? 'rose' : hotfixCount === 1 ? 'amber' : 'emerald',
    },
  ];
}

function buildReviewIndicators(prioritizedPullRequests: PrioritizedPullRequest[]): HealthIndicator[] {
  const total = prioritizedPullRequests.length;
  const noApprovals = prioritizedPullRequests.filter((pr) => pr.approvals === 0 && !pr.isDraft).length;
  const pendingReviews = prioritizedPullRequests.reduce((sum, pr) => sum + pr.pendingReviewers, 0);
  const avgReviewers = total === 0
    ? 0
    : prioritizedPullRequests.reduce((sum, pr) => sum + pr.reviewers.length, 0) / total;
  const requiredReviewerLoad = prioritizedPullRequests.filter((pr) =>
    pr.reviewers.some((reviewer) => reviewer.isRequired && reviewer.vote === 0),
  ).length;

  return [
    {
      id: 'coverage',
      title: 'Sin aprobación',
      value: total === 0 ? '0%' : formatPercentage((noApprovals / total) * 100),
      description: 'PRs listos que aún no reciben un voto positivo.',
      tone: noApprovals >= 5 ? 'rose' : noApprovals >= 2 ? 'amber' : 'emerald',
    },
    {
      id: 'pending-load',
      title: 'Backlog de review',
      value: `${pendingReviews}`,
      description: 'Cantidad total de decisiones pendientes por reviewers.',
      tone: pendingReviews >= 10 ? 'rose' : pendingReviews >= 5 ? 'amber' : 'emerald',
    },
    {
      id: 'avg-reviewers',
      title: 'Reviewers por PR',
      value: avgReviewers.toFixed(1),
      description: 'Ayuda a detectar subcobertura o sobrecarga de revisión.',
      tone: avgReviewers < 1.5 ? 'amber' : avgReviewers > 3.5 ? 'amber' : 'emerald',
    },
    {
      id: 'required-bottleneck',
      title: 'Bottleneck requerido',
      value: `${requiredReviewerLoad}`,
      description: 'PRs bloqueados por reviewers obligatorios sin respuesta.',
      tone: requiredReviewerLoad >= 3 ? 'rose' : requiredReviewerLoad >= 1 ? 'amber' : 'emerald',
    },
  ];
}

function buildGovernanceAlerts(prioritizedPullRequests: PrioritizedPullRequest[]): AttentionAlert[] {
  const total = prioritizedPullRequests.length;
  const noDescription = prioritizedPullRequests.filter(hasEmptyDescription).length;
  const oversized = prioritizedPullRequests.filter((pr) => pr.pendingReviewers >= 3 || pr.riskScore >= 5).length;
  const directToMain = prioritizedPullRequests.filter((pr) =>
    ['main', 'master'].includes(pr.targetBranch.toLowerCase()) && pr.sourceBranch.startsWith('hotfix/'),
  ).length;
  const draftBacklog = prioritizedPullRequests.filter((pr) => pr.isDraft && pr.ageHours >= 48).length;

  return [
    {
      id: 'missing-context',
      title: 'PRs sin contexto',
      detail: `${noDescription} de ${total} sin descripción suficiente.`,
      tone: noDescription >= 3 ? 'rose' : noDescription >= 1 ? 'amber' : 'emerald',
    },
    {
      id: 'oversized-risk',
      title: 'Riesgo de revisión',
      detail: `${oversized} PRs con alta carga o demasiados puntos pendientes.`,
      tone: oversized >= 4 ? 'rose' : oversized >= 2 ? 'amber' : 'sky',
    },
    {
      id: 'prod-pressure',
      title: 'Presión sobre producción',
      detail: `${directToMain} hotfixes yendo directo a main/master.`,
      tone: directToMain >= 2 ? 'rose' : directToMain === 1 ? 'amber' : 'emerald',
    },
    {
      id: 'draft-drift',
      title: 'Drafts envejecidos',
      detail: `${draftBacklog} drafts abiertos por más de 48 horas.`,
      tone: draftBacklog >= 2 ? 'amber' : draftBacklog === 1 ? 'sky' : 'emerald',
    },
  ];
}

function countPullRequestsOlderThan(prioritizedPullRequests: PrioritizedPullRequest[], minHours: number): number {
  return prioritizedPullRequests.filter((pr) => pr.ageHours >= minHours).length;
}

function buildRepositoryInsights(prioritizedPullRequests: PrioritizedPullRequest[]): RepositoryInsight[] {
  const grouped = new Map<string, RepositoryInsight>();

  prioritizedPullRequests.forEach((pr) => {
    const current = grouped.get(pr.repository) || {
      name: pr.repository,
      total: 0,
      highRisk: 0,
      blocked: 0,
    };

    current.total += 1;
    if (pr.riskScore >= 4) {
      current.highRisk += 1;
    }
    if (hasMergeConflict(pr)) {
      current.blocked += 1;
    }

    grouped.set(pr.repository, current);
  });

  return Array.from(grouped.values()).sort((left, right) => right.total - left.total).slice(0, 5);
}

function classifyBranch(branchName: string): string {
  if (branchName.startsWith('feature/')) {
    return 'feature/*';
  }
  if (branchName.startsWith('bugfix/') || branchName.startsWith('fix/')) {
    return 'bugfix/*';
  }
  if (branchName.startsWith('hotfix/')) {
    return 'hotfix/*';
  }
  if (branchName.startsWith('release/')) {
    return 'release/*';
  }
  return 'other';
}

function buildBranchInsights(prioritizedPullRequests: PrioritizedPullRequest[]): BranchInsight[] {
  const grouped = new Map<string, number>();

  prioritizedPullRequests.forEach((pr) => {
    const label = classifyBranch(pr.sourceBranch);
    grouped.set(label, (grouped.get(label) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((left, right) => right.total - left.total);
}

function buildReviewerInsights(prioritizedPullRequests: PrioritizedPullRequest[]): ReviewerInsight[] {
  const grouped = new Map<string, number>();

  prioritizedPullRequests.forEach((pr) => {
    pr.reviewers.forEach((reviewer) => {
      if (reviewer.vote !== 0) {
        return;
      }

      const key = reviewer.displayName || reviewer.uniqueName || 'Unknown reviewer';
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
  });

  return Array.from(grouped.entries())
    .map(([reviewer, pending]) => ({ reviewer, pending }))
    .sort((left, right) => right.pending - left.pending)
    .slice(0, 5);
}

function formatLastUpdate(date: Date | null): string {
  if (!date) {
    return 'Not synced yet';
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function buildDashboardSummary(
  pullRequests: PullRequest[],
  lastUpdatedAt: Date | null,
  scopeLabel: string,
  targetReviewer?: string,
): DashboardSummary {
  const prioritizedPullRequests = prioritizePullRequests(pullRequests);

  return {
    metrics: buildMetrics(prioritizedPullRequests, targetReviewer),
    prioritizedPullRequests,
    repositoryInsights: buildRepositoryInsights(prioritizedPullRequests),
    branchInsights: buildBranchInsights(prioritizedPullRequests),
    reviewerInsights: buildReviewerInsights(prioritizedPullRequests),
    deliveryIndicators: buildDeliveryIndicators(prioritizedPullRequests),
    reviewIndicators: buildReviewIndicators(prioritizedPullRequests),
    governanceAlerts: buildGovernanceAlerts(prioritizedPullRequests),
    lastUpdatedLabel: formatLastUpdate(lastUpdatedAt),
    scopeLabel,
    noDescriptionCount: prioritizedPullRequests.filter(hasEmptyDescription).length,
    activePRs: prioritizedPullRequests.length,
    highRiskPRs: prioritizedPullRequests.filter((pr) => pr.riskScore >= 4).length,
    blockedPRs: prioritizedPullRequests.filter(hasMergeConflict).length,
    reviewBacklog: prioritizedPullRequests.reduce((sum, pr) => sum + pr.pendingReviewers, 0),
    averageAgeHours: getAverageAgeHours(prioritizedPullRequests),
    stalePRs: countPullRequestsOlderThan(prioritizedPullRequests, 72),
    repositoryCount: new Set(prioritizedPullRequests.map((pr) => pr.repository)).size,
    hotfixPRs: prioritizedPullRequests.filter((pr) => pr.sourceBranch.startsWith('hotfix/')).length,
  };
}

export function getRiskBadgeClass(riskScore: number): string {
  if (riskScore >= 5) {
    return 'bg-rose-100 text-rose-700';
  }

  if (riskScore >= 3) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-emerald-100 text-emerald-700';
}
