import type {
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositoryProviderKind,
  RepositoryProviderSelection,
  RepositorySummary,
  ReviewItem,
} from '../../../types/repository';

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
  prioritizedPullRequests: PrioritizedPullRequest[];
  repositoryInsights: RepositoryInsight[];
  branchInsights: BranchInsight[];
  reviewerInsights: ReviewerInsight[];
  deliveryIndicators: HealthIndicator[];
  reviewIndicators: HealthIndicator[];
  governanceAlerts: AttentionAlert[];
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
