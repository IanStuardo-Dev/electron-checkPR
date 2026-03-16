import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositorySummary,
  ReviewItem,
  ReviewItemReviewer,
} from '../../types/repository';
import { readJsonResponse } from '../http-response';
import { mapWithConcurrency } from '../request-control';

interface GitHubRepositoryResponse {
  name: string;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
}

interface GitHubBranchResponse {
  name: string;
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
  }>;
  assignees?: Array<{
    login: string;
  }>;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

interface GitHubReviewResponseItem {
  user?: {
    login: string;
  };
  state: string;
}

const GITHUB_API_VERSION = '2022-11-28';

function getGitHubConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'personalAccessToken'>> & { repository: string } {
  return {
    organization: config.organization.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/+$/, ''),
    personalAccessToken: config.personalAccessToken.trim(),
    repository: (config.repositoryId || config.project || '').trim().replace(/^\/+|\/+$/g, ''),
  };
}

async function requestGitHubJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${personalAccessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  return readJsonResponse<T>(response, {
    providerLabel: 'GitHub',
    context,
    forbiddenHint: 'Revisa scopes del token.',
  });
}

async function requestGitHubJsonResponse<T>(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${personalAccessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  return {
    data: await readJsonResponse<T>(response, {
      providerLabel: 'GitHub',
      context,
      forbiddenHint: 'Revisa scopes del token.',
    }),
    headers: response.headers,
  };
}

function getGitHubNextPage(headers: Headers): string | null {
  const linkHeader = headers.get('link');
  if (!linkHeader) {
    return null;
  }

  const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return nextMatch?.[1] || null;
}

async function requestGitHubPaginated<T>(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await requestGitHubJsonResponse<T[]>(nextUrl, personalAccessToken, context);
    results.push(...response.data);
    nextUrl = getGitHubNextPage(response.headers);
  }

  return results;
}

export async function getGitHubRepositoriesWeb(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
  const { organization, personalAccessToken } = getGitHubConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Owner/organization y token son obligatorios para GitHub.');
  }

  const allRepositories = await requestGitHubPaginated<GitHubRepositoryResponse>(
    'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
    personalAccessToken,
    'repositories request',
  );

  return allRepositories
    .filter((repository) => repository.owner.login.toLowerCase() === organization.toLowerCase())
    .map((repository) => ({
      id: repository.name,
      name: repository.name,
      webUrl: repository.html_url,
      defaultBranch: repository.default_branch,
    }));
}

export async function getGitHubProjectsWeb(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
  const repositories = await getGitHubRepositoriesWeb(config);
  return repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    state: 'active',
  }));
}

export async function getGitHubBranchesWeb(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
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

export async function getGitHubPullRequestsWeb(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
  const { organization, personalAccessToken, repository } = getGitHubConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Owner/organization y token son obligatorios para GitHub.');
  }

  const targetRepositories = repository
    ? [{ id: repository, name: repository }]
    : await getGitHubRepositoriesWeb(config);

  const reviewItems = await Promise.all(
    targetRepositories.map(async (targetRepository) => {
      const pullRequests = await requestGitHubPaginated<GitHubPullRequestListResponseItem>(
        `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(targetRepository.name)}/pulls?state=open&per_page=50&sort=created&direction=desc`,
        personalAccessToken,
        `pull requests request (${targetRepository.name})`,
      );

      return mapWithConcurrency(pullRequests, 5, async (pullRequest) => ({
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
        mergeStatus: 'unknown',
        createdBy: {
          displayName: pullRequest.user?.login || 'Unknown author',
          uniqueName: pullRequest.user?.login,
          imageUrl: pullRequest.user?.avatar_url,
        },
        reviewers: await getPullRequestReviewers(
          organization,
          targetRepository.name,
          pullRequest.number,
          personalAccessToken,
          pullRequest.requested_reviewers,
          pullRequest.assignees,
        ),
      } satisfies ReviewItem));
    }),
  );

  return reviewItems.flat().sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
