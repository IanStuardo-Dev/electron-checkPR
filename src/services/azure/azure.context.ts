import type { AzureConnectionConfig } from '../../types/azure';
import { getAzureConfig } from './azure.api';

export interface RequiredAzureProjectContext {
  organization: string;
  project: string;
  personalAccessToken: string;
}

export interface RequiredAzureRepositoryContext extends RequiredAzureProjectContext {
  repositoryId: string;
}

export function getRequiredAzureProjectContext(config: AzureConnectionConfig): RequiredAzureProjectContext {
  const { organization, project, personalAccessToken } = getAzureConfig(config);

  if (!organization || !project || !personalAccessToken) {
    throw new Error('Organization, project, and personal access token are required.');
  }

  return {
    organization,
    project,
    personalAccessToken,
  };
}

export function getRequiredAzureRepositoryContext(config: AzureConnectionConfig): RequiredAzureRepositoryContext {
  const repositoryContext = {
    ...getRequiredAzureProjectContext(config),
    repositoryId: config.repositoryId?.trim() || '',
  };

  if (!repositoryContext.repositoryId) {
    throw new Error('Organization, project, repository, and personal access token are required.');
  }

  return repositoryContext;
}
