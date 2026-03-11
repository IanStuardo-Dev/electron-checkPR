import type { AzureBranch, AzureConnectionConfig, AzureProject, AzureRepository, PullRequest } from '../../types/azure';
import type { RepositorySnapshot } from '../../types/analysis';
import type { RepositorySnapshotOptions } from '../../types/repository';
import { mapWithConcurrency, retryWithBackoff } from '../shared/request-control';
import { appendPartialReason, isProbablyBinaryContent, MAX_SNAPSHOT_FILE_BYTES } from '../shared/snapshot-content';

interface AzurePullRequestResponse {
  value: Array<{
    pullRequestId: number;
    title: string;
    description?: string;
    status: string;
    creationDate: string;
    repository?: {
      name: string;
      id: string;
      webUrl?: string;
    };
    sourceRefName: string;
    targetRefName: string;
    url: string;
    isDraft?: boolean;
    mergeStatus?: string;
    createdBy?: {
      displayName: string;
      uniqueName?: string;
      imageUrl?: string;
    };
    reviewers?: Array<{
      displayName: string;
      uniqueName?: string;
      vote: number;
      isRequired?: boolean;
    }>;
  }>;
}

interface AzureRepositoriesResponse {
  value: Array<{
    id: string;
    name: string;
    webUrl?: string;
    defaultBranch?: string;
  }>;
}

interface AzureProjectsResponse {
  value: Array<{
    id: string;
    name: string;
    state?: string;
  }>;
}

interface AzureRefsResponse {
  value: Array<{
    name: string;
    objectId: string;
  }>;
}

interface AzureItemsResponse {
  value: Array<{
    path: string;
    isFolder?: boolean;
    contentMetadata?: {
      fileName?: string;
    };
  }>;
}

const AZURE_API_VERSION = '7.1';
const SUPPORTED_CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 'py', 'java', 'kt', 'go', 'rb', 'php', 'cs', 'swift',
  'scala', 'rs', 'c', 'cc', 'cpp', 'h', 'hpp', 'm', 'mm', 'sql', 'yml', 'yaml', 'toml',
  'sh', 'bash', 'zsh', 'md',
]);

function normalizeBranchName(branchRef: string): string {
  return branchRef.replace('refs/heads/', '');
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

function encodePat(personalAccessToken: string): string {
  return Buffer.from(`:${personalAccessToken}`).toString('base64');
}

function normalizeOrganization(rawOrganization: string): string {
  const trimmed = rawOrganization.trim().replace(/\/+$/, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const [firstSegment] = url.pathname.split('/').filter(Boolean);
      return firstSegment || trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed
    .replace(/^dev\.azure\.com\//, '')
    .replace(/\.visualstudio\.com$/, '');
}

function normalizeProject(rawProject: string): string {
  const trimmed = rawProject.trim().replace(/^\/+|\/+$/g, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      return segments[1] || segments[0] || trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function getAzureConfig(config: AzureConnectionConfig): Required<Pick<AzureConnectionConfig, 'organization' | 'project' | 'personalAccessToken'>> {
  const organization = normalizeOrganization(config.organization);
  const project = normalizeProject(config.project);
  const personalAccessToken = config.personalAccessToken.trim();

  return {
    organization,
    project,
    personalAccessToken,
  };
}

async function readAzureResponse<T>(response: Response, context: string): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  const responsePreview = responseText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);

  if (!response.ok) {
    const detail = responsePreview || response.statusText;

    if (response.status === 401) {
      throw new Error(`Azure DevOps ${context} failed (401): unauthorized. Response: ${detail || 'empty body'}`);
    }

    throw new Error(`Azure DevOps ${context} failed (${response.status}): ${detail}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Azure DevOps ${context} returned unexpected content (${contentType || 'unknown'}). Response: ${responsePreview || 'empty body'}`,
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`Azure DevOps ${context} returned invalid JSON. Revisa organization/project y que el endpoint exista.`);
  }
}

async function requestAzureJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodePat(personalAccessToken)}`,
      Accept: 'application/json',
    },
  });

  return readAzureResponse<T>(response, context);
}

async function requestAzureText(url: string, personalAccessToken: string, context: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodePat(personalAccessToken)}`,
      Accept: 'text/plain, application/json',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    const detail = responseText.replace(/\s+/g, ' ').trim().slice(0, 280) || response.statusText;

    if (response.status === 401) {
      throw new Error(`Azure DevOps ${context} failed (401): unauthorized. Response: ${detail || 'empty body'}`);
    }

    throw new Error(`Azure DevOps ${context} failed (${response.status}): ${detail}`);
  }

  return response.text();
}

export class PullRequestService {
  async getProjects(config: AzureConnectionConfig): Promise<AzureProject[]> {
    const { organization, personalAccessToken } = getAzureConfig(config);

    if (!organization || !personalAccessToken) {
      throw new Error('Organization and personal access token are required.');
    }

    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/_apis/projects?api-version=${AZURE_API_VERSION}`;
    const payload = await requestAzureJson<AzureProjectsResponse>(requestUrl, personalAccessToken, 'projects request');

    return payload.value.map((project) => ({
      id: project.id,
      name: project.name,
      state: project.state,
    }));
  }

  async getRepositories(config: AzureConnectionConfig): Promise<AzureRepository[]> {
    const { organization, project, personalAccessToken } = getAzureConfig(config);

    if (!organization || !project || !personalAccessToken) {
      throw new Error('Organization, project, and personal access token are required.');
    }

    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories?api-version=${AZURE_API_VERSION}`;
    const payload = await requestAzureJson<AzureRepositoriesResponse>(requestUrl, personalAccessToken, 'repositories request');

    return payload.value.map((repository) => ({
      id: repository.id,
      name: repository.name,
      webUrl: repository.webUrl,
      defaultBranch: repository.defaultBranch,
    }));
  }

  async getBranches(config: AzureConnectionConfig): Promise<AzureBranch[]> {
    const { organization, project, personalAccessToken } = getAzureConfig(config);
    const repositoryId = config.repositoryId?.trim();

    if (!organization || !project || !personalAccessToken || !repositoryId) {
      throw new Error('Organization, project, repository, and personal access token are required.');
    }

    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/refs?filter=heads/&api-version=${AZURE_API_VERSION}`;
    const payload = await requestAzureJson<AzureRefsResponse>(requestUrl, personalAccessToken, 'branches request');

    return payload.value.map((branch) => ({
      name: branch.name.replace('refs/heads/', ''),
      objectId: branch.objectId,
      isDefault: branch.name === 'refs/heads/main' || branch.name === 'refs/heads/master',
    }));
  }

  async getPullRequests(config: AzureConnectionConfig): Promise<PullRequest[]> {
    const { organization, project, personalAccessToken } = getAzureConfig(config);

    if (!organization || !project || !personalAccessToken) {
      throw new Error('Organization, project, and personal access token are required.');
    }

    const query = new URLSearchParams({
      'searchCriteria.status': 'active',
      '$top': '100',
      'api-version': AZURE_API_VERSION,
    });

    if (config.repositoryId?.trim()) {
      query.set('searchCriteria.repositoryId', config.repositoryId.trim());
    }

    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/pullrequests?${query.toString()}`;
    const payload = await requestAzureJson<AzurePullRequestResponse>(requestUrl, personalAccessToken, 'pull requests request');

    return payload.value.map((pr) => ({
      id: pr.pullRequestId,
      title: pr.title,
      description: pr.description || 'No description provided.',
      status: pr.status,
      repository: pr.repository?.name || 'Unknown repository',
      createdAt: pr.creationDate,
      sourceBranch: normalizeBranchName(pr.sourceRefName),
      targetBranch: normalizeBranchName(pr.targetRefName),
      url: pr.repository?.webUrl
        ? `${pr.repository.webUrl}/pullrequest/${pr.pullRequestId}`
        : pr.url,
      isDraft: Boolean(pr.isDraft),
      mergeStatus: pr.mergeStatus || 'unknown',
      createdBy: {
        displayName: pr.createdBy?.displayName || 'Unknown author',
        uniqueName: pr.createdBy?.uniqueName,
        imageUrl: pr.createdBy?.imageUrl,
      },
      reviewers: (pr.reviewers || []).map((reviewer) => ({
        displayName: reviewer.displayName,
        uniqueName: reviewer.uniqueName,
        vote: reviewer.vote,
        isRequired: reviewer.isRequired,
      })),
    }));
  }

  async getRepositorySnapshot(
    config: AzureConnectionConfig,
    options: RepositorySnapshotOptions,
  ): Promise<RepositorySnapshot> {
    const startedAt = Date.now();
    const { organization, project, personalAccessToken } = getAzureConfig(config);
    const repositoryId = config.repositoryId?.trim();

    if (!organization || !project || !personalAccessToken || !repositoryId) {
      throw new Error('Organization, project, repository, and personal access token are required.');
    }

    const itemsUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?scopePath=/&recursionLevel=Full&includeContentMetadata=true&versionDescriptor.version=${encodeURIComponent(options.branchName)}&versionDescriptor.versionType=branch&api-version=${AZURE_API_VERSION}`;
    const payload = await requestAzureJson<AzureItemsResponse>(itemsUrl, personalAccessToken, 'repository items request');

    const candidateFiles = payload.value
      .filter((item) => !item.isFolder && item.path)
      .filter((item) => isSupportedCodeFile(item.path))
      .filter((item) => options.includeTests || !isTestFile(item.path))
      .sort((left, right) => rankPath(right.path) - rankPath(left.path) || left.path.localeCompare(right.path));

    const selectedFiles = candidateFiles.slice(0, options.maxFiles);
    let retryCount = 0;
    let skippedLargeFiles = 0;
    let skippedBinaryFiles = 0;
    const files = (await mapWithConcurrency(selectedFiles, 5, async (file) => {
      const contentUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?path=${encodeURIComponent(file.path)}&versionDescriptor.version=${encodeURIComponent(options.branchName)}&versionDescriptor.versionType=branch&download=false&resolveLfs=true&api-version=${AZURE_API_VERSION}`;
      const content = await retryWithBackoff(
        () => requestAzureText(contentUrl, personalAccessToken, `item content request (${file.path})`),
        {
          onRetry: () => {
            retryCount += 1;
          },
        },
      );

      if (Buffer.byteLength(content, 'utf8') > MAX_SNAPSHOT_FILE_BYTES) {
        skippedLargeFiles += 1;
        return null;
      }

      if (isProbablyBinaryContent(content)) {
        skippedBinaryFiles += 1;
        return null;
      }

      return {
        path: file.path.replace(/^\//, ''),
        extension: file.path.split('.').pop()?.toLowerCase() || '',
        size: content.length,
        content,
      };
    })).filter((file) => file !== null);

    const partialReason = appendPartialReason(
      candidateFiles.length > options.maxFiles
        ? `El snapshot se recorto a ${options.maxFiles} archivos priorizados de ${candidateFiles.length} descubiertos en Azure DevOps.`
        : undefined,
      [
        skippedLargeFiles > 0 ? `Se omitieron ${skippedLargeFiles} archivos por exceder ${Math.round(MAX_SNAPSHOT_FILE_BYTES / 1024)} KB.` : '',
        skippedBinaryFiles > 0 ? `Se omitieron ${skippedBinaryFiles} archivos por contenido binario o no legible.` : '',
      ],
    );

    return {
      provider: 'azure-devops',
      repository: repositoryId,
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

export const pullRequestServiceInternals = {
  normalizeOrganization,
  normalizeProject,
  readAzureResponse,
};

export const pullRequestService = new PullRequestService();
