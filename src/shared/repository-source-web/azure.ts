import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositorySummary,
  ReviewItem,
} from '../../types/repository';
import { readJsonResponse } from '../http-response';

interface AzureProjectsResponse {
  value: Array<{
    id: string;
    name: string;
    state?: string;
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

interface AzureRefsResponse {
  value: Array<{
    name: string;
    objectId: string;
  }>;
}

interface AzurePullRequestResponse {
  value: Array<{
    pullRequestId: number;
    title: string;
    description?: string;
    status: string;
    creationDate: string;
    repository?: {
      name: string;
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

const AZURE_API_VERSION = '7.1';

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

function getAzureConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'project' | 'personalAccessToken'>> {
  return {
    organization: normalizeOrganization(config.organization),
    project: normalizeProject(config.project),
    personalAccessToken: config.personalAccessToken.trim(),
  };
}

function encodeBasicAuth(personalAccessToken: string): string {
  const rawValue = `:${personalAccessToken}`;

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(rawValue);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(rawValue).toString('base64');
  }

  throw new Error('No fue posible codificar el token para Azure DevOps en este entorno.');
}

function getAzureContinuationToken(headers: Headers): string | null {
  return headers.get('x-ms-continuationtoken');
}

async function requestAzureJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodeBasicAuth(personalAccessToken)}`,
      Accept: 'application/json',
    },
  });

  return readJsonResponse<T>(response, {
    providerLabel: 'Azure DevOps',
    context,
    invalidJsonHint: 'Revisa organization/project y que el endpoint exista.',
  });
}

async function requestAzureJsonResponse<T>(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodeBasicAuth(personalAccessToken)}`,
      Accept: 'application/json',
    },
  });

  return {
    data: await readJsonResponse<T>(response, {
      providerLabel: 'Azure DevOps',
      context,
      invalidJsonHint: 'Revisa organization/project y que el endpoint exista.',
    }),
    headers: response.headers,
  };
}

async function requestAzureCollection<TItem, TResponse extends { value: TItem[] }, TMappedItem>(
  personalAccessToken: string,
  description: string,
  buildRequestUrl: (continuationToken: string | null) => string,
  mapItem: (item: TItem) => TMappedItem,
): Promise<TMappedItem[]> {
  const results: TMappedItem[] = [];
  let continuationToken: string | null = null;

  do {
    const response = await requestAzureJsonResponse<TResponse>(
      buildRequestUrl(continuationToken),
      personalAccessToken,
      description,
    );
    results.push(...response.data.value.map(mapItem));
    continuationToken = getAzureContinuationToken(response.headers);
  } while (continuationToken);

  return results;
}

export async function getAzureProjectsWeb(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
  const { organization, personalAccessToken } = getAzureConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Organization and personal access token are required.');
  }

  return requestAzureCollection<AzureProjectsResponse['value'][number], AzureProjectsResponse, RepositoryProject>(
    personalAccessToken,
    'projects request',
    (continuationToken) => {
      const query = new URLSearchParams({
        'api-version': AZURE_API_VERSION,
      });

      if (continuationToken) {
        query.set('continuationToken', continuationToken);
      }

      return `https://dev.azure.com/${encodeURIComponent(organization)}/_apis/projects?${query.toString()}`;
    },
    (project) => ({
      id: project.id,
      name: project.name,
      state: project.state,
    }),
  );
}

export async function getAzureRepositoriesWeb(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
  const { organization, project, personalAccessToken } = getAzureConfig(config);

  if (!organization || !project || !personalAccessToken) {
    throw new Error('Organization, project, and personal access token are required.');
  }

  return requestAzureCollection<AzureRepositoriesResponse['value'][number], AzureRepositoriesResponse, RepositorySummary>(
    personalAccessToken,
    'repositories request',
    (continuationToken) => {
      const query = new URLSearchParams({
        'api-version': AZURE_API_VERSION,
      });

      if (continuationToken) {
        query.set('continuationToken', continuationToken);
      }

      return `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories?${query.toString()}`;
    },
    (repository) => ({
      id: repository.id,
      name: repository.name,
      webUrl: repository.webUrl,
      defaultBranch: repository.defaultBranch,
    }),
  );
}

export async function getAzureBranchesWeb(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
  const { organization, project, personalAccessToken } = getAzureConfig(config);
  const repositoryId = config.repositoryId?.trim() || '';

  if (!organization || !project || !personalAccessToken || !repositoryId) {
    throw new Error('Organization, project, repository and personal access token are required.');
  }

  const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/refs?filter=heads/&api-version=${AZURE_API_VERSION}`;
  const payload = await requestAzureJson<AzureRefsResponse>(requestUrl, personalAccessToken, 'branches request');

  return payload.value.map((branch) => ({
    name: branch.name.replace('refs/heads/', ''),
    objectId: branch.objectId,
    isDefault: branch.name === 'refs/heads/main' || branch.name === 'refs/heads/master',
  }));
}

function normalizeBranchName(branchRef: string): string {
  return branchRef.replace('refs/heads/', '');
}

export async function getAzurePullRequestsWeb(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
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

  const pullRequests: ReviewItem[] = [];
  let skip = 0;

  while (true) {
    query.set('$skip', String(skip));
    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/pullrequests?${query.toString()}`;
    const payload = await requestAzureJson<AzurePullRequestResponse>(requestUrl, personalAccessToken, 'pull requests request');

    pullRequests.push(...payload.value.map((pr) => ({
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
    })));

    if (payload.value.length < 100) {
      break;
    }

    skip += 100;
  }

  return pullRequests;
}
