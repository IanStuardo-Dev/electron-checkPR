import type { AzureBranch, AzureConnectionConfig, AzureProject, AzureRepository } from '../../types/azure';
import { AZURE_API_VERSION, getAzureConfig, getAzureContinuationToken, requestAzureJson, requestAzureJsonResponse } from './azure.api';
import type { AzureProjectsResponse, AzureRefsResponse, AzureRepositoriesResponse } from './azure.types';
import { getRequiredAzureProjectContext, getRequiredAzureRepositoryContext } from './azure.context';

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

export async function getAzureProjects(config: AzureConnectionConfig): Promise<AzureProject[]> {
  const { organization, personalAccessToken } = getAzureConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Organization and personal access token are required.');
  }

  return requestAzureCollection<AzureProjectsResponse['value'][number], AzureProjectsResponse, AzureProject>(
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
    (project: AzureProjectsResponse['value'][number]) => ({
      id: project.id,
      name: project.name,
      state: project.state,
    }),
  );
}

export async function getAzureRepositories(config: AzureConnectionConfig): Promise<AzureRepository[]> {
  const { organization, project, personalAccessToken } = getRequiredAzureProjectContext(config);

  return requestAzureCollection<AzureRepositoriesResponse['value'][number], AzureRepositoriesResponse, AzureRepository>(
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
    (repository: AzureRepositoriesResponse['value'][number]) => ({
      id: repository.id,
      name: repository.name,
      webUrl: repository.webUrl,
      defaultBranch: repository.defaultBranch,
    }),
  );
}

export async function getAzureBranches(config: AzureConnectionConfig): Promise<AzureBranch[]> {
  const { organization, project, personalAccessToken, repositoryId } = getRequiredAzureRepositoryContext(config);

  const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/refs?filter=heads/&api-version=${AZURE_API_VERSION}`;
  const payload = await requestAzureJson<AzureRefsResponse>(requestUrl, personalAccessToken, 'branches request');

  return payload.value.map((branch) => ({
    name: branch.name.replace('refs/heads/', ''),
    objectId: branch.objectId,
    isDefault: branch.name === 'refs/heads/main' || branch.name === 'refs/heads/master',
  }));
}
