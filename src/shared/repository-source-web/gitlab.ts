import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositorySummary,
  ReviewItem,
  ReviewItemReviewer,
} from '../../types/repository';
import { readJsonResponse } from '../http-response';

interface GitLabProjectResponse {
  path_with_namespace: string;
  web_url: string;
  default_branch?: string;
}

interface GitLabBranchResponse {
  name: string;
  default: boolean;
  commit: {
    id: string;
  };
}

interface GitLabUserRef {
  username: string;
  name: string;
  avatar_url?: string;
}

interface GitLabMergeRequestResponse {
  iid: number;
  title: string;
  description: string | null;
  state: string;
  created_at: string;
  web_url: string;
  draft?: boolean;
  work_in_progress?: boolean;
  detailed_merge_status?: string;
  source_branch: string;
  target_branch: string;
  author?: GitLabUserRef;
  reviewers?: GitLabUserRef[];
  assignees?: GitLabUserRef[];
}

interface GitLabApprovalsResponse {
  approved_by?: Array<{
    user?: GitLabUserRef;
  }>;
}

const GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';

function getGitLabConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'personalAccessToken'>> & { project: string } {
  return {
    organization: config.organization.trim()
      .replace(/^https?:\/\/gitlab\.com\//, '')
      .replace(/^gitlab\.com\//, '')
      .replace(/\/+$/, ''),
    personalAccessToken: config.personalAccessToken.trim(),
    project: (config.repositoryId || config.project || '').trim().replace(/^\/+|\/+$/g, ''),
  };
}

async function requestGitLabJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'PRIVATE-TOKEN': personalAccessToken,
    },
  });

  return readJsonResponse<T>(response, {
    providerLabel: 'GitLab',
    context,
    forbiddenHint: 'Revisa scopes del token.',
  });
}

async function requestGitLabPaginated<T>(
  buildUrl: (page: number, perPage: number) => string,
  personalAccessToken: string,
  context: string,
  perPage = 100,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const payload = await requestGitLabJson<T[]>(
      buildUrl(page, perPage),
      personalAccessToken,
      `${context} (page ${page})`,
    );

    items.push(...payload);

    if (payload.length < perPage) {
      break;
    }

    page += 1;
  }

  return items;
}

export async function getGitLabRepositoriesWeb(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
  const { organization, personalAccessToken } = getGitLabConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Namespace/group y token son obligatorios para GitLab.');
  }

  const payload = await requestGitLabPaginated<GitLabProjectResponse>(
    (page, perPage) => `${GITLAB_API_BASE_URL}/projects?membership=true&simple=true&per_page=${perPage}&page=${page}&order_by=last_activity_at&sort=desc`,
    personalAccessToken,
    'projects request',
  );

  const normalizedNamespace = organization.toLowerCase();

  return payload
    .filter((project) => project.path_with_namespace.toLowerCase().startsWith(`${normalizedNamespace}/`))
    .map((project) => ({
      id: project.path_with_namespace,
      name: project.path_with_namespace,
      webUrl: project.web_url,
      defaultBranch: project.default_branch,
    }));
}

export async function getGitLabProjectsWeb(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
  const repositories = await getGitLabRepositoriesWeb(config);
  return repositories.map((repository) => ({
    id: repository.id,
    name: repository.id,
    state: 'active',
  }));
}

export async function getGitLabBranchesWeb(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
  const { personalAccessToken, project } = getGitLabConfig(config);

  if (!project || !personalAccessToken) {
    throw new Error('Proyecto y token son obligatorios para GitLab.');
  }

  const payload = await requestGitLabJson<GitLabBranchResponse[]>(
    `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/branches?per_page=100`,
    personalAccessToken,
    'branches request',
  );

  return payload.map((branch) => ({
    name: branch.name,
    objectId: branch.commit.id,
    isDefault: branch.default,
  }));
}

function toReviewer(user: GitLabUserRef, vote: number, isRequired = false): ReviewItemReviewer {
  return {
    displayName: user.name || user.username,
    uniqueName: user.username,
    vote,
    isRequired,
  };
}

async function getApprovals(
  projectPath: string,
  mergeRequestIid: number,
  personalAccessToken: string,
): Promise<ReviewItemReviewer[]> {
  const payload = await requestGitLabJson<GitLabApprovalsResponse>(
    `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(projectPath)}/merge_requests/${mergeRequestIid}/approvals`,
    personalAccessToken,
    `merge request approvals request (${projectPath}!${mergeRequestIid})`,
  );

  return (payload.approved_by || [])
    .map((approval) => approval.user)
    .filter((user): user is GitLabUserRef => Boolean(user))
    .map((user) => toReviewer(user, 10));
}

export async function getGitLabPullRequestsWeb(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
  const { organization, personalAccessToken, project } = getGitLabConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Namespace/group y token son obligatorios para GitLab.');
  }

  const targetProjects = project
    ? [{ id: project, name: project }]
    : await getGitLabProjectsWeb(config);

  const mergeRequests = await Promise.all(
    targetProjects.map(async (targetProject) => {
      const payload = await requestGitLabPaginated<GitLabMergeRequestResponse>(
        (page, perPage) => `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(targetProject.id)}/merge_requests?state=opened&scope=all&per_page=${perPage}&page=${page}&order_by=created_at&sort=desc`,
        personalAccessToken,
        `merge requests request (${targetProject.name})`,
        50,
      );

      return Promise.all(payload.map(async (mergeRequest) => {
        const approvedReviewers = await getApprovals(targetProject.id, mergeRequest.iid, personalAccessToken);
        const reviewers = new Map<string, ReviewItemReviewer>();

        approvedReviewers.forEach((reviewer) => {
          if (reviewer.uniqueName) {
            reviewers.set(reviewer.uniqueName, reviewer);
          }
        });

        (mergeRequest.reviewers || []).forEach((reviewer) => {
          reviewers.set(reviewer.username, {
            displayName: reviewer.name,
            uniqueName: reviewer.username,
            vote: reviewers.get(reviewer.username)?.vote ?? 0,
            isRequired: true,
          });
        });

        (mergeRequest.assignees || []).forEach((assignee) => {
          if (!reviewers.has(assignee.username)) {
            reviewers.set(assignee.username, toReviewer(assignee, 0));
          }
        });

        return {
          id: mergeRequest.iid,
          title: mergeRequest.title,
          description: mergeRequest.description || 'No description provided.',
          status: mergeRequest.state,
          repository: targetProject.name,
          createdAt: mergeRequest.created_at,
          sourceBranch: mergeRequest.source_branch,
          targetBranch: mergeRequest.target_branch,
          url: mergeRequest.web_url,
          isDraft: Boolean(mergeRequest.draft || mergeRequest.work_in_progress),
          mergeStatus: mergeRequest.detailed_merge_status || 'unknown',
          createdBy: {
            displayName: mergeRequest.author?.name || mergeRequest.author?.username || 'Unknown author',
            uniqueName: mergeRequest.author?.username,
            imageUrl: mergeRequest.author?.avatar_url,
          },
          reviewers: Array.from(reviewers.values()),
        } satisfies ReviewItem;
      }));
    }),
  );

  return mergeRequests.flat().sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
