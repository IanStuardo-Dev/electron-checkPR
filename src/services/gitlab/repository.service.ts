import type { RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySnapshotOptions, RepositorySummary, ReviewItem, ReviewItemReviewer } from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import { appendPartialReason, isProbablyBinaryContent, MAX_SNAPSHOT_FILE_BYTES } from '../shared/snapshot-content';

interface GitLabProjectResponse {
  id: number;
  name: string;
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

interface GitLabTreeItemResponse {
  path: string;
  type: 'blob' | 'tree';
}

interface GitLabFileResponse {
  file_path: string;
  size: number;
  content: string;
  encoding: string;
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
const SUPPORTED_CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 'py', 'java', 'kt', 'go', 'rb', 'php', 'cs', 'swift',
  'scala', 'rs', 'c', 'cc', 'cpp', 'h', 'hpp', 'm', 'mm', 'sql', 'yml', 'yaml', 'toml',
  'sh', 'bash', 'zsh', 'md',
]);

function getGitLabConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'personalAccessToken'>> & { project: string } {
  const organization = config.organization.trim()
    .replace(/^https?:\/\/gitlab\.com\//, '')
    .replace(/^gitlab\.com\//, '')
    .replace(/\/+$/, '');
  const personalAccessToken = config.personalAccessToken.trim();
  const project = (config.repositoryId || config.project || '').trim().replace(/^\/+|\/+$/g, '');

  return {
    organization,
    personalAccessToken,
    project,
  };
}

async function readGitLabResponse<T>(response: Response, context: string): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  const responsePreview = responseText.replace(/\s+/g, ' ').trim().slice(0, 280);

  if (!response.ok) {
    const detail = responsePreview || response.statusText;

    if (response.status === 401) {
      throw new Error(`GitLab ${context} failed (401): unauthorized. Response: ${detail || 'empty body'}`);
    }

    if (response.status === 403) {
      throw new Error(`GitLab ${context} failed (403): forbidden. Revisa scopes del token. Response: ${detail || 'empty body'}`);
    }

    throw new Error(`GitLab ${context} failed (${response.status}): ${detail}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`GitLab ${context} returned unexpected content (${contentType || 'unknown'}). Response: ${responsePreview || 'empty body'}`);
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`GitLab ${context} returned invalid JSON.`);
  }
}

async function requestGitLabJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'PRIVATE-TOKEN': personalAccessToken,
    },
  });

  return readGitLabResponse<T>(response, context);
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

async function requestPaginatedGitLabTree(
  project: string,
  branchName: string,
  personalAccessToken: string,
): Promise<GitLabTreeItemResponse[]> {
  const items: GitLabTreeItemResponse[] = [];
  const perPage = 100;
  let page = 1;

  while (true) {
    const payload = await requestGitLabJson<GitLabTreeItemResponse[]>(
      `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/tree?ref=${encodeURIComponent(branchName)}&recursive=true&per_page=${perPage}&page=${page}`,
      personalAccessToken,
      `repository tree request (page ${page})`,
    );

    items.push(...payload);

    if (payload.length < perPage) {
      break;
    }

    page += 1;
  }

  return items;
}

function normalizeNamespace(value: string): string {
  return value.toLowerCase();
}

function buildProject(project: GitLabProjectResponse): RepositoryProject {
  return {
    id: project.path_with_namespace,
    name: project.path_with_namespace,
    state: 'active',
  };
}

function buildRepository(project: GitLabProjectResponse): RepositorySummary {
  return {
    id: project.path_with_namespace,
    name: project.path_with_namespace,
    webUrl: project.web_url,
    defaultBranch: project.default_branch,
  };
}

function isTestFile(path: string): boolean {
  return /(^|\/)(test|tests|__tests__|spec|specs)(\/|$)|\.(spec|test)\./i.test(path);
}

function isSupportedCodeFile(path: string): boolean {
  const extension = path.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_CODE_EXTENSIONS.has(extension);
}

function rankPath(path: string): number {
  if (/auth|security|permission|payment|billing|token|secret/i.test(path)) {
    return 4;
  }
  if (/src|app|server|api|core/i.test(path)) {
    return 3;
  }
  if (/config|infra|deploy/i.test(path)) {
    return 2;
  }
  return 1;
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

export class GitLabRepositoryService {
  async getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
    const repositories = await this.getRepositories(config);
    return repositories.map((repository) => ({
      id: repository.id,
      name: repository.name,
      state: 'active',
    }));
  }

  async getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
    const { organization, personalAccessToken } = getGitLabConfig(config);

    if (!organization || !personalAccessToken) {
      throw new Error('Namespace/group y token son obligatorios para GitLab.');
    }

    const payload = await requestGitLabPaginated<GitLabProjectResponse>(
      (page, perPage) => `${GITLAB_API_BASE_URL}/projects?membership=true&simple=true&per_page=${perPage}&page=${page}&order_by=last_activity_at&sort=desc`,
      personalAccessToken,
      'projects request',
    );

    const normalizedNamespace = normalizeNamespace(organization);

    return payload
      .filter((project) => normalizeNamespace(project.path_with_namespace).startsWith(`${normalizedNamespace}/`))
      .map(buildRepository);
  }

  async getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
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

  async getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
    const { organization, personalAccessToken, project } = getGitLabConfig(config);

    if (!organization || !personalAccessToken) {
      throw new Error('Namespace/group y token son obligatorios para GitLab.');
    }

    const targetProjects = project
      ? [{ id: project, name: project }]
      : await this.getProjects(config);

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

  async getRepositorySnapshot(
    config: RepositoryConnectionConfig,
    options: RepositorySnapshotOptions,
  ): Promise<RepositorySnapshot> {
    const startedAt = Date.now();
    const { personalAccessToken, project } = getGitLabConfig({
      ...config,
      repositoryId: config.repositoryId || config.project,
    });

    if (!project || !personalAccessToken) {
      throw new Error('Proyecto y token son obligatorios para GitLab.');
    }

    const tree = await requestPaginatedGitLabTree(project, options.branchName, personalAccessToken);

    const candidateFiles = tree
      .filter((item) => item.type === 'blob')
      .filter((item) => isSupportedCodeFile(item.path))
      .filter((item) => options.includeTests || !isTestFile(item.path))
      .sort((left, right) => rankPath(right.path) - rankPath(left.path) || left.path.localeCompare(right.path));

    const selectedFiles = candidateFiles.slice(0, options.maxFiles);
    let retryCount = 0;
    let skippedLargeFiles = 0;
    let skippedBinaryFiles = 0;
    const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
      const payload = await retryWithBackoff(() => requestGitLabJson<GitLabFileResponse>(
        `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/files/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(options.branchName)}`,
        personalAccessToken,
        `file request (${file.path})`,
      ), {
        onRetry: () => {
          retryCount += 1;
        },
      });

      if (payload.size > MAX_SNAPSHOT_FILE_BYTES) {
        skippedLargeFiles += 1;
        return null;
      }

      const content = payload.encoding === 'base64'
        ? Buffer.from(payload.content, 'base64').toString('utf8')
        : payload.content;

      if (isProbablyBinaryContent(content)) {
        skippedBinaryFiles += 1;
        return null;
      }

      return {
        path: payload.file_path,
        extension: payload.file_path.split('.').pop()?.toLowerCase() || '',
        size: payload.size,
        content,
      };
    })).filter((file) => file !== null);

    const partialReason = appendPartialReason(
      candidateFiles.length > options.maxFiles
        ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos en GitLab.`
        : undefined,
      [
        skippedLargeFiles > 0 ? `Se omitieron ${skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.` : '',
        skippedBinaryFiles > 0 ? `Se omitieron ${skippedBinaryFiles} archivos por contenido binario o no legible.` : '',
      ],
    );

    return {
      provider: 'gitlab',
      repository: project,
      branch: options.branchName,
      files,
      totalFilesDiscovered: candidateFiles.length,
      truncated: candidateFiles.length > options.maxFiles || skippedLargeFiles > 0 || skippedBinaryFiles > 0,
      partialReason,
      metrics: {
        durationMs: Date.now() - startedAt,
        retryCount,
        discardedByPrioritization: Math.max(0, candidateFiles.length - selectedFiles.length),
        discardedBySize: skippedLargeFiles,
        discardedByBinaryDetection: skippedBinaryFiles,
      },
    };
  }
}

export const gitLabRepositoryService = new GitLabRepositoryService();
