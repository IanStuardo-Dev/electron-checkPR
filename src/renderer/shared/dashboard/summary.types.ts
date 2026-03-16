import type { PullRequestAiReview } from '../../../types/analysis';
import type { PrioritizedPullRequest } from '../../../types/repository';

export type { PrioritizedPullRequest } from '../../../types/repository';

export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  detail: string;
  tone: 'sky' | 'amber' | 'rose' | 'emerald';
}

export interface OperationalPullRequest extends PrioritizedPullRequest {
  aiReview: PullRequestAiReview;
}

export interface RepositoryInsight {
  name: string;
  total: number;
  highRisk: number;
  blocked: number;
}

export interface BranchInsight {
  label: string;
  total: number;
}

export interface ReviewerInsight {
  reviewer: string;
  pending: number;
}

export interface HealthIndicator {
  id: string;
  title: string;
  value: string;
  description: string;
  tone: 'sky' | 'amber' | 'rose' | 'emerald';
}

export interface AttentionAlert {
  id: string;
  title: string;
  detail: string;
  tone: 'sky' | 'amber' | 'rose' | 'emerald';
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  executiveMetrics: DashboardMetric[];
  queueMetrics: DashboardMetric[];
  prioritizedPullRequests: PrioritizedPullRequest[];
  operationalPullRequests: OperationalPullRequest[];
  repositoryInsights: RepositoryInsight[];
  branchInsights: BranchInsight[];
  reviewerInsights: ReviewerInsight[];
  reviewerWorkload: ReviewerInsight[];
  deliveryIndicators: HealthIndicator[];
  reviewIndicators: HealthIndicator[];
  governanceAlerts: AttentionAlert[];
  prAiSignals: AttentionAlert[];
  aiCoverage: {
    analyzed: number;
    eligible: number;
    highRisk: number;
    errored: number;
    omitted: number;
    configured: boolean;
  };
  lastUpdatedLabel: string;
  scopeLabel: string;
  noDescriptionCount: number;
  activePRs: number;
  highRiskPRs: number;
  blockedPRs: number;
  reviewBacklog: number;
  averageAgeHours: number;
  stalePRs: number;
  repositoryCount: number;
  hotfixPRs: number;
}
