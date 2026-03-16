import type {
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositoryProviderSelection,
  RepositorySummary,
  ReviewItem,
} from '../../../types/repository';
import type { PullRequestAiReview, PullRequestAnalysisPromptDirectives } from '../../../types/analysis';

export type SavedConnectionConfig = Omit<RepositoryConnectionConfig, 'provider' | 'personalAccessToken'> & {
  provider: RepositoryProviderSelection;
  personalAccessToken: string;
};

export interface AzureDiagnostics {
  operation: 'projects' | 'repositories' | 'pullRequests' | null;
  provider: RepositoryProviderSelection;
  organization: string;
  project: string;
  repositoryId: string;
  requestPath: string;
  lastError: string | null;
}

export interface CodexIntegrationConfig {
  enabled: boolean;
  model: string;
  analysisDepth: 'standard' | 'deep';
  maxFilesPerRun: number;
  includeTests: boolean;
  repositoryScope: 'selected' | 'all';
  apiKey: string;
  snapshotPolicy: {
    excludedPathPatterns: string;
    strictMode: boolean;
  };
  prReview: {
    enabled: boolean;
    maxPullRequests: number;
    selectionMode: 'top-risk' | 'oldest' | 'mixed';
    analysisDepth: 'standard' | 'deep';
    promptDirectives: PullRequestAnalysisPromptDirectives;
  };
  promptDirectives: {
    architectureReviewEnabled: boolean;
    architecturePattern: string;
    requiredPractices: string;
    forbiddenPractices: string;
    domainContext: string;
    customInstructions: string;
  };
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  detail: string;
  tone: 'sky' | 'amber' | 'rose' | 'emerald';
}

export interface PrioritizedPullRequest extends ReviewItem {
  ageHours: number;
  riskScore: number;
  approvals: number;
  pendingReviewers: number;
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

export interface DashboardScope {
  projects: RepositoryProject[];
  projectsLoading: boolean;
  repositories: RepositorySummary[];
  repositoriesLoading: boolean;
  selectedRepositoryName: string | null;
}
