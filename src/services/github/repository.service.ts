import type { RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySnapshotOptions, RepositorySummary, ReviewItem, ReviewItemReviewer } from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import { appendPartialReason, isProbablyBinaryContent, MAX_SNAPSHOT_FILE_BYTES } from '../shared/snapshot-content';

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

interface GitHubTreeResponse {
  tree: Array<{
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
  }>;
  truncated?: boolean;
}

interface GitHubBlobResponse {
  content: string;
  encoding: string;
  size: number;
}

interface GitHubContentFileResponse {
  type: 'file';
  path: string;
  size: number;
  content: string;
  encoding: string;
}

interface GitHubContentDirectoryItem {
  type: 'file' | 'dir';
  path: string;
  size: number;
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

interface GitHubReviewResponseItem {
  user?: {
    login: string;
    avatar_url?: string;
  };
  state: string;
}

const GITHUB_API_VERSION = '2022-11-28';
const SUPPORTED_CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 'py', 'java', 'kt', 'go', 'rb', 'php', 'cs', 'swift',
  'scala', 'rs', 'c', 'cc', 'cpp', 'h', 'hpp', 'm', 'mm', 'sql', 'yml', 'yaml', 'toml',
  'sh', 'bash', 'zsh', 'md',
]);

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

async function requestGitHubContent(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<GitHubContentFileResponse | GitHubContentDirectoryItem[]> {
  return requestGitHubJson<GitHubContentFileResponse | GitHubContentDirectoryItem[]>(url, personalAccessToken, context);
}

function buildRepositorySummary(repository: GitHubRepositoryResponse): RepositorySummary {
  return {
    id: repository.name,
    name: repository.name,
    webUrl: repository.html_url,
    defaultBranch: repository.default_branch,
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

async function enumerateGitHubContents(
  owner: string,
  repository: string,
  branchName: string,
  personalAccessToken: string,
): Promise<Array<{ path: string; size?: number }>> {
  const queue = [''];
  const files: Array<{ path: string; size?: number }> = [];

  while (queue.length > 0) {
    const currentPath = queue.shift() || '';
    const pathSuffix = currentPath ? `/${currentPath.split('/').map(encodeURIComponent).join('/')}` : '';
      const payload = await retryWithBackoff(() => requestGitHubContent(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents${pathSuffix}?ref=${encodeURIComponent(branchName)}`,
        personalAccessToken,
        `repository contents request (${currentPath || '/'})`,
      ));

    if (Array.isArray(payload)) {
      payload.forEach((item) => {
        if (item.type === 'dir') {
          queue.push(item.path);
          return;
        }

        files.push({
          path: item.path,
          size: item.size,
        });
      });
    }
  }

  return files;
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

        return mapWithConcurrency(pullRequests, 5, async (pullRequest) => {
          const reviewers = await getPullRequestReviewers(
              organization,
              targetRepository.name,
              pullRequest.number,
              personalAccessToken,
              pullRequest.requested_reviewers,
              pullRequest.assignees,
            );

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
            mergeStatus: 'unknown',
            createdBy: {
              displayName: pullRequest.user?.login || 'Unknown author',
              uniqueName: pullRequest.user?.login,
              imageUrl: pullRequest.user?.avatar_url,
            },
            reviewers,
          } satisfies ReviewItem;
        });
      }),
    );

    return reviewItems.flat().sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }

  async getRepositorySnapshot(
    config: RepositoryConnectionConfig,
    options: RepositorySnapshotOptions,
  ): Promise<RepositorySnapshot> {
    const startedAt = Date.now();
    const { organization, personalAccessToken, repository } = getGitHubConfig({
      ...config,
      repositoryId: config.repositoryId || config.project,
    });

    if (!organization || !repository || !personalAccessToken) {
      throw new Error('Owner/organization, repository y token son obligatorios para GitHub.');
    }

    const tree = await requestGitHubJson<GitHubTreeResponse>(
      `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(options.branchName)}?recursive=1`,
      personalAccessToken,
      'repository tree request',
    );

    const treeFiles = tree.tree
      .filter((item) => item.type === 'blob' && item.path)
      .map((item) => ({
        path: item.path,
        size: item.size,
      }));

    const discoveredFiles = tree.truncated
      ? await enumerateGitHubContents(organization, repository, options.branchName, personalAccessToken)
      : treeFiles;

    const candidateFiles = discoveredFiles
      .filter((item) => isSupportedCodeFile(item.path))
      .filter((item) => options.includeTests || !isTestFile(item.path))
      .sort((left, right) => {
        const scoreDelta = rankPath(right.path) - rankPath(left.path);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }
        return (left.size || 0) - (right.size || 0);
      });

    const selectedFiles = candidateFiles.slice(0, options.maxFiles);
    let retryCount = 0;
    let skippedLargeFiles = 0;
    let skippedBinaryFiles = 0;
    const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
      if ((file.size || 0) > MAX_SNAPSHOT_FILE_BYTES) {
        skippedLargeFiles += 1;
        return null;
      }

      const contentPayload = await retryWithBackoff(() => requestGitHubContent(
        `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/contents/${file.path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(options.branchName)}`,
        personalAccessToken,
        `content request (${file.path})`,
      ), {
        onRetry: () => {
          retryCount += 1;
        },
      });

      if (Array.isArray(contentPayload) || contentPayload.type !== 'file') {
        throw new Error(`GitHub content request (${file.path}) returned a directory payload unexpectedly.`);
      }

      const content = contentPayload.encoding === 'base64'
        ? Buffer.from(contentPayload.content.replace(/\n/g, ''), 'base64').toString('utf8')
        : contentPayload.content;

      if (contentPayload.size > MAX_SNAPSHOT_FILE_BYTES) {
        skippedLargeFiles += 1;
        return null;
      }

      if (isProbablyBinaryContent(content)) {
        skippedBinaryFiles += 1;
        return null;
      }

      return {
        path: file.path,
        extension: file.path.split('.').pop()?.toLowerCase() || '',
        size: contentPayload.size,
        content,
      };
    })).filter((file) => file !== null);

    const partialReason = appendPartialReason(
      tree.truncated
        ? 'GitHub reporto el tree como truncado; se reconstruyo el inventario via contents y el analisis puede omitir archivos profundos o no textuales.'
        : candidateFiles.length > options.maxFiles
          ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos.`
          : undefined,
      [
        skippedLargeFiles > 0 ? `Se omitieron ${skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.` : '',
        skippedBinaryFiles > 0 ? `Se omitieron ${skippedBinaryFiles} archivos por contenido binario o no legible.` : '',
      ],
    );

    return {
      provider: 'github',
      repository,
      branch: options.branchName,
      files,
      totalFilesDiscovered: candidateFiles.length,
      truncated: candidateFiles.length > options.maxFiles || Boolean(tree.truncated) || skippedLargeFiles > 0 || skippedBinaryFiles > 0,
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

export const gitHubRepositoryServiceInternals = {
  getGitHubConfig,
  readGitHubResponse,
  enumerateGitHubContents,
};

export const gitHubRepositoryService = new GitHubRepositoryService();
