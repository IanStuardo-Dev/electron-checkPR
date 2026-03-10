import type { RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySummary, ReviewItem, ReviewItemReviewer } from '../../types/repository';

interface GitHubRepositoryResponse {
  id: number;
  name: string;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
}

interface GitHubBranchResponse {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
  };
}

interface GitHubPullRequestListResponseItem {
  number: number;
  title: string;
  body: string | null;
  state: string;
  created_at: string;
  html_url: string;
  draft?: boolean;
  user?: {
    login: string;
    avatar_url?: string;
  };
  requested_reviewers?: Array<{
    login: string;
    avatar_url?: string;
  }>;
  assignees?: Array<{
    login: string;
    avatar_url?: string;
  }>;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

interface GitHubPullRequestDetailResponse {
  mergeable_state?: string;
}

interface GitHubReviewResponseItem {
  user?: {
    login: string;
    avatar_url?: string;
  };
  state: string;
}

const GITHUB_API_VERSION = '2022-11-28';

function getGitHubConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'personalAccessToken'>> & { repository: string } {
  const organization = config.organization.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/+$/, '');
  const personalAccessToken = config.personalAccessToken.trim();
  const repository = (config.repositoryId || config.project || '').trim().replace(/^\/+|\/+$/g, '');

  return {
    organization,
    personalAccessToken,
    repository,
  };
}

async function readGitHubResponse<T>(response: Response, context: string): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  const responsePreview = responseText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);

  if (!response.ok) {
    const detail = responsePreview || response.statusText;

    if (response.status === 401) {
      throw new Error(`GitHub ${context} failed (401): unauthorized. Response: ${detail || 'empty body'}`);
    }

    if (response.status === 403) {
      throw new Error(`GitHub ${context} failed (403): forbidden. Revisa scopes del token. Response: ${detail || 'empty body'}`);
    }

    throw new Error(`GitHub ${context} failed (${response.status}): ${detail}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `GitHub ${context} returned unexpected content (${contentType || 'unknown'}). Response: ${responsePreview || 'empty body'}`,
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`GitHub ${context} returned invalid JSON.`);
  }
}

async function requestGitHubJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${personalAccessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  return readGitHubResponse<T>(response, context);
}

function buildRepositorySummary(repository: GitHubRepositoryResponse): RepositorySummary {
  return {
    id: repository.name,
    name: repository.name,
    webUrl: repository.html_url,
    defaultBranch: repository.default_branch,
  };
}

function getReviewerVote(state: string): number {
  switch (state.toUpperCase()) {
    case 'APPROVED':
      return 10;
    case 'CHANGES_REQUESTED':
      return -10;
    default:
      return 0;
  }
}

async function getPullRequestReviewers(
  owner: string,
  repository: string,
  pullNumber: number,
  personalAccessToken: string,
  requestedReviewers: GitHubPullRequestListResponseItem['requested_reviewers'],
  assignees: GitHubPullRequestListResponseItem['assignees'],
): Promise<ReviewItemReviewer[]> {
  const reviews = await requestGitHubJson<GitHubReviewResponseItem[]>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullNumber}/reviews?per_page=100`,
    personalAccessToken,
    `pull request reviews request (#${pullNumber})`,
  );

  const latestReviewByUser = new Map<string, GitHubReviewResponseItem>();
  reviews.forEach((review) => {
    if (review.user?.login) {
      latestReviewByUser.set(review.user.login, review);
    }
  });

  const reviewers = new Map<string, ReviewItemReviewer>();

  latestReviewByUser.forEach((review, login) => {
    reviewers.set(login, {
      displayName: login,
      uniqueName: login,
      vote: getReviewerVote(review.state),
      isRequired: false,
    });
  });

  (requestedReviewers || []).forEach((reviewer) => {
    reviewers.set(reviewer.login, {
      displayName: reviewer.login,
      uniqueName: reviewer.login,
      vote: reviewers.get(reviewer.login)?.vote ?? 0,
      isRequired: true,
    });
  });

  (assignees || []).forEach((assignee) => {
    if (!reviewers.has(assignee.login)) {
      reviewers.set(assignee.login, {
        displayName: assignee.login,
        uniqueName: assignee.login,
        vote: 0,
        isRequired: false,
      });
    }
  });

  return Array.from(reviewers.values());
}

export class GitHubRepositoryService {
  async getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
    const repositories = await this.getRepositories(config);

    return repositories.map((repository) => ({
      id: repository.id,
      name: repository.name,
      state: 'active',
    }));
  }

  async getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
    const { organization, personalAccessToken } = getGitHubConfig(config);

    if (!organization || !personalAccessToken) {
      throw new Error('Owner/organization y token son obligatorios para GitHub.');
    }

    const payload = await requestGitHubJson<GitHubRepositoryResponse[]>(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
      personalAccessToken,
      'repositories request',
    );

    return payload
      .filter((repository) => repository.owner.login.toLowerCase() === organization.toLowerCase())
      .map(buildRepositorySummary);
  }

  async getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
    const { organization, personalAccessToken, repository } = getGitHubConfig(config);

    if (!organization || !repository || !personalAccessToken) {
      throw new Error('Owner/organization, repository y token son obligatorios para GitHub.');
    }

    const repositoryDetails = await requestGitHubJson<GitHubRepositoryResponse>(
      `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}`,
      personalAccessToken,
      'repository request',
    );
    const payload = await requestGitHubJson<GitHubBranchResponse[]>(
      `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/branches?per_page=100`,
      personalAccessToken,
      'branches request',
    );

    return payload.map((branch) => ({
      name: branch.name,
      objectId: branch.commit.sha,
      isDefault: branch.name === repositoryDetails.default_branch,
    }));
  }

  async getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
    const { organization, personalAccessToken, repository } = getGitHubConfig(config);

    if (!organization || !personalAccessToken) {
      throw new Error('Owner/organization y token son obligatorios para GitHub.');
    }

    const targetRepositories = repository
      ? [{ id: repository, name: repository }]
      : await this.getRepositories(config);

    const reviewItems = await Promise.all(
      targetRepositories.map(async (targetRepository) => {
        const pullRequests = await requestGitHubJson<GitHubPullRequestListResponseItem[]>(
          `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(targetRepository.name)}/pulls?state=open&per_page=50&sort=created&direction=desc`,
          personalAccessToken,
          `pull requests request (${targetRepository.name})`,
        );

        return Promise.all(pullRequests.map(async (pullRequest) => {
          const [detail, reviewers] = await Promise.all([
            requestGitHubJson<GitHubPullRequestDetailResponse>(
              `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(targetRepository.name)}/pulls/${pullRequest.number}`,
              personalAccessToken,
              `pull request detail request (${targetRepository.name}#${pullRequest.number})`,
            ),
            getPullRequestReviewers(
              organization,
              targetRepository.name,
              pullRequest.number,
              personalAccessToken,
              pullRequest.requested_reviewers,
              pullRequest.assignees,
            ),
          ]);

          return {
            id: pullRequest.number,
            title: pullRequest.title,
            description: pullRequest.body || 'No description provided.',
            status: pullRequest.state,
            repository: targetRepository.name,
            createdAt: pullRequest.created_at,
            sourceBranch: pullRequest.head.ref,
            targetBranch: pullRequest.base.ref,
            url: pullRequest.html_url,
            isDraft: Boolean(pullRequest.draft),
            mergeStatus: detail.mergeable_state || 'unknown',
            createdBy: {
              displayName: pullRequest.user?.login || 'Unknown author',
              uniqueName: pullRequest.user?.login,
              imageUrl: pullRequest.user?.avatar_url,
            },
            reviewers,
          } satisfies ReviewItem;
        }));
      }),
    );

    return reviewItems.flat().sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }
}

export const gitHubRepositoryService = new GitHubRepositoryService();
