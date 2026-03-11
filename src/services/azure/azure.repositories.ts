import type { AzureBranch, AzureConnectionConfig, AzureProject, AzureRepository } from '../../types/azure';
import { AZURE_API_VERSION, getAzureConfig, getAzureContinuationToken, requestAzureJson, requestAzureJsonResponse } from './azure.api';
import type { AzureProjectsResponse, AzureRefsResponse, AzureRepositoriesResponse } from './azure.types';

export async function getAzureProjects(config: AzureConnectionConfig): Promise<AzureProject[]> {
  const { organization, personalAccessToken } = getAzureConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Organization and personal access token are required.');
  }

  const projects: AzureProject[] = [];
  let continuationToken: string | null = null;

  do {
    const query = new URLSearchParams({
      'api-version': AZURE_API_VERSION,
    });

    if (continuationToken) {
      query.set('continuationToken', continuationToken);
    }

    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/_apis/projects?${query.toString()}`;
    const response = await requestAzureJsonResponse<AzureProjectsResponse>(requestUrl, personalAccessToken, 'projects request');
    projects.push(...response.data.value.map((project) => ({
      id: project.id,
      name: project.name,
      state: project.state,
    })));
    continuationToken = getAzureContinuationToken(response.headers);
  } while (continuationToken);

  return projects;
}

export async function getAzureRepositories(config: AzureConnectionConfig): Promise<AzureRepository[]> {
  const { organization, project, personalAccessToken } = getAzureConfig(config);

  if (!organization || !project || !personalAccessToken) {
    throw new Error('Organization, project, and personal access token are required.');
  }

  const repositories: AzureRepository[] = [];
  let continuationToken: string | null = null;

  do {
    const query = new URLSearchParams({
      'api-version': AZURE_API_VERSION,
    });

    if (continuationToken) {
      query.set('continuationToken', continuationToken);
    }

    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories?${query.toString()}`;
    const response = await requestAzureJsonResponse<AzureRepositoriesResponse>(requestUrl, personalAccessToken, 'repositories request');
    repositories.push(...response.data.value.map((repository) => ({
      id: repository.id,
      name: repository.name,
      webUrl: repository.webUrl,
      defaultBranch: repository.defaultBranch,
    })));
    continuationToken = getAzureContinuationToken(response.headers);
  } while (continuationToken);

  return repositories;
}

export async function getAzureBranches(config: AzureConnectionConfig): Promise<AzureBranch[]> {
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
