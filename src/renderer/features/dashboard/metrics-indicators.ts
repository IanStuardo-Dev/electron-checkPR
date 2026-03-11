import type { AttentionAlert, DashboardMetric, HealthIndicator, PrioritizedPullRequest } from './types';
import {
  countPullRequestsOlderThan,
  formatHours,
  formatPercentage,
  getAverageAgeHours,
  hasEmptyDescription,
  hasMergeConflict,
} from './metrics-core';

export function buildMetrics(
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
    { id: 'active-prs', title: 'PRs activos', value: activePRs, detail: 'Volumen actual para revisar', tone: 'sky' },
    { id: 'high-risk', title: 'PRs con riesgo', value: highRiskPRs, detail: 'Viejos, bloqueados o sin contexto', tone: 'amber' },
    { id: 'blocked', title: 'Bloqueados', value: blockedPRs, detail: 'Conflictos de merge detectados', tone: 'rose' },
    {
      id: 'reviewer-workload',
      title: targetReviewer ? 'Pendientes del reviewer' : 'Esperando review',
      value: reviewerWorkload,
      detail: targetReviewer ? `Backlog de ${targetReviewer}` : 'Listos para acción del equipo',
      tone: 'emerald',
    },
    { id: 'repositories', title: 'Repos impactados', value: repositoriesInReview, detail: 'Repositorios con PRs abiertos', tone: 'sky' },
    { id: 'average-age', title: 'Edad promedio', value: formatHours(averageAgeHours), detail: 'Tiempo medio en cola', tone: 'amber' },
    { id: 'drafts', title: 'Drafts', value: draftPRs, detail: 'PRs aún no listos para merge', tone: 'rose' },
    { id: 'approved', title: 'Con aprobación', value: prioritizedPullRequests.filter((pr) => pr.approvals > 0).length, detail: 'PRs con al menos un voto positivo', tone: 'emerald' },
  ];
}

export function buildDeliveryIndicators(prioritizedPullRequests: PrioritizedPullRequest[]): HealthIndicator[] {
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
    { id: 'avg-age', title: 'Edad promedio', value: formatHours(averageAgeHours), description: 'Mide cuánto tarda la cola en moverse.', tone: averageAgeHours >= 72 ? 'rose' : averageAgeHours >= 36 ? 'amber' : 'emerald' },
    { id: 'stale-ratio', title: 'PRs stale', value: total === 0 ? '0%' : formatPercentage((stale / total) * 100), description: 'Porcentaje de PRs abiertos hace más de 72 horas.', tone: stale >= 5 ? 'rose' : stale >= 2 ? 'amber' : 'emerald' },
    { id: 'mainline-targeting', title: 'Apuntando a ramas core', value: total === 0 ? '0%' : formatPercentage((mainlineTargeting / total) * 100), description: 'PRs que afectan el flujo principal de entrega.', tone: mainlineTargeting >= Math.max(3, Math.ceil(total * 0.6)) ? 'amber' : 'sky' },
    { id: 'hotfix-pressure', title: 'Presión de hotfix', value: total === 0 ? '0%' : formatPercentage((hotfixCount / total) * 100), description: 'Señal temprana de trabajo reactivo sobre producción.', tone: hotfixCount >= 2 ? 'rose' : hotfixCount === 1 ? 'amber' : 'emerald' },
  ];
}

export function buildReviewIndicators(prioritizedPullRequests: PrioritizedPullRequest[]): HealthIndicator[] {
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
    { id: 'coverage', title: 'Sin aprobación', value: total === 0 ? '0%' : formatPercentage((noApprovals / total) * 100), description: 'PRs listos que aún no reciben un voto positivo.', tone: noApprovals >= 5 ? 'rose' : noApprovals >= 2 ? 'amber' : 'emerald' },
    { id: 'pending-load', title: 'Backlog de review', value: `${pendingReviews}`, description: 'Cantidad total de decisiones pendientes por reviewers.', tone: pendingReviews >= 10 ? 'rose' : pendingReviews >= 5 ? 'amber' : 'emerald' },
    { id: 'avg-reviewers', title: 'Reviewers por PR', value: avgReviewers.toFixed(1), description: 'Ayuda a detectar subcobertura o sobrecarga de revisión.', tone: avgReviewers < 1.5 ? 'amber' : avgReviewers > 3.5 ? 'amber' : 'emerald' },
    { id: 'required-bottleneck', title: 'Bottleneck requerido', value: `${requiredReviewerLoad}`, description: 'PRs bloqueados por reviewers obligatorios sin respuesta.', tone: requiredReviewerLoad >= 3 ? 'rose' : requiredReviewerLoad >= 1 ? 'amber' : 'emerald' },
  ];
}

export function buildGovernanceAlerts(prioritizedPullRequests: PrioritizedPullRequest[]): AttentionAlert[] {
  const total = prioritizedPullRequests.length;
  const noDescription = prioritizedPullRequests.filter(hasEmptyDescription).length;
  const oversized = prioritizedPullRequests.filter((pr) => pr.pendingReviewers >= 3 || pr.riskScore >= 5).length;
  const directToMain = prioritizedPullRequests.filter((pr) =>
    ['main', 'master'].includes(pr.targetBranch.toLowerCase()) && pr.sourceBranch.startsWith('hotfix/'),
  ).length;
  const draftBacklog = prioritizedPullRequests.filter((pr) => pr.isDraft && pr.ageHours >= 48).length;

  return [
    { id: 'missing-context', title: 'PRs sin contexto', detail: `${noDescription} de ${total} sin descripción suficiente.`, tone: noDescription >= 3 ? 'rose' : noDescription >= 1 ? 'amber' : 'emerald' },
    { id: 'oversized-risk', title: 'Riesgo de revisión', detail: `${oversized} PRs con alta carga o demasiados puntos pendientes.`, tone: oversized >= 4 ? 'rose' : oversized >= 2 ? 'amber' : 'sky' },
    { id: 'prod-pressure', title: 'Presión sobre producción', detail: `${directToMain} hotfixes yendo directo a main/master.`, tone: directToMain >= 2 ? 'rose' : directToMain === 1 ? 'amber' : 'emerald' },
    { id: 'draft-drift', title: 'Drafts envejecidos', detail: `${draftBacklog} drafts abiertos por más de 48 horas.`, tone: draftBacklog >= 2 ? 'amber' : draftBacklog === 1 ? 'sky' : 'emerald' },
  ];
}
