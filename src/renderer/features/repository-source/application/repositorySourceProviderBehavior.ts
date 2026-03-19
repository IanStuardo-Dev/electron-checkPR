import type { RepositoryProviderSelection } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';

type RepositorySourceOperation = 'projects' | 'repositories' | 'pullRequests' | null;

interface RepositorySourceProviderBehavior {
  buildScopeLabel: (
    config: SavedConnectionConfig,
    selectedProjectName: string | null,
    selectedRepositoryName: string | null,
  ) => string;
  buildRequestPath: (operation: RepositorySourceOperation, config: SavedConnectionConfig) => string;
  applyConfigChange: (
    current: SavedConnectionConfig,
    name: keyof SavedConnectionConfig,
    value: string,
  ) => SavedConnectionConfig;
  applyProjectSelection: (
    current: SavedConnectionConfig,
    project: string,
  ) => SavedConnectionConfig;
  hasMinimumRepositoryConfig: (config: SavedConnectionConfig) => boolean;
  mirrorsProjectsAsRepositories: boolean;
}

function buildAzureScopeLabel(
  config: SavedConnectionConfig,
  selectedProjectName: string | null,
  selectedRepositoryName: string | null,
): string {
  const organization = config.organization || 'No organization';
  const project = selectedProjectName || config.project || 'Sin proyecto';
  const repository = selectedRepositoryName || 'Todos los repositorios';
  return `${organization} / ${project} / ${repository}`;
}

function buildNamespaceScopeLabel(
  config: SavedConnectionConfig,
  _selectedProjectName: string | null,
  selectedRepositoryName: string | null,
): string {
  const organization = config.organization || 'No organization';
  const project = selectedRepositoryName || config.project || 'Todos los repositorios';
  return `${organization} / ${project}`;
}

function applyGenericConfigChange(
  current: SavedConnectionConfig,
  name: keyof SavedConnectionConfig,
  value: string,
): SavedConnectionConfig {
  return {
    ...current,
    ...(name === 'provider'
      ? {
        organization: '',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      }
      : {}),
    ...(name === 'organization'
      ? { project: '', repositoryId: '' }
      : {}),
    ...(name === 'project'
      ? { repositoryId: '' }
      : {}),
    [name]: value,
  };
}

const azureBehavior: RepositorySourceProviderBehavior = {
  mirrorsProjectsAsRepositories: false,
  buildScopeLabel: buildAzureScopeLabel,
  buildRequestPath(operation, config) {
    const organization = config.organization.trim();
    const project = config.project.trim();

    if (operation === 'projects') {
      return `https://dev.azure.com/${organization}/_apis/projects`;
    }

    if (operation === 'repositories') {
      return `https://dev.azure.com/${organization}/${project}/_apis/git/repositories`;
    }

    if (operation === 'pullRequests') {
      return `https://dev.azure.com/${organization}/${project}/_apis/git/pullrequests`;
    }

    return '';
  },
  applyConfigChange: applyGenericConfigChange,
  applyProjectSelection(current, project) {
    return {
      ...current,
      project,
      repositoryId: '',
    };
  },
  hasMinimumRepositoryConfig(config) {
    return Boolean(config.organization && config.project && config.personalAccessToken);
  },
};

const namespaceBehavior: RepositorySourceProviderBehavior = {
  mirrorsProjectsAsRepositories: true,
  buildScopeLabel: buildNamespaceScopeLabel,
  buildRequestPath(operation, config) {
    const organization = config.organization.trim();
    const repository = config.repositoryId?.trim() || config.project.trim();

    if (config.provider === 'github') {
      if (operation === 'projects' || operation === 'repositories') {
        return 'https://api.github.com/user/repos';
      }

      if (operation === 'pullRequests') {
        return repository
          ? `https://api.github.com/repos/${organization}/${repository}/pulls`
          : 'https://api.github.com/user/repos -> /repos/{owner}/{repo}/pulls';
      }

      return '';
    }

    if (operation === 'projects' || operation === 'repositories') {
      return 'https://gitlab.com/api/v4/projects';
    }

    if (operation === 'pullRequests') {
      return repository
        ? `https://gitlab.com/api/v4/projects/${encodeURIComponent(repository)}/merge_requests`
        : 'https://gitlab.com/api/v4/projects -> /projects/{id}/merge_requests';
    }

    return '';
  },
  applyConfigChange: applyGenericConfigChange,
  applyProjectSelection(current, project) {
    return {
      ...current,
      project,
      repositoryId: project,
    };
  },
  hasMinimumRepositoryConfig(config) {
    return Boolean(config.organization && config.personalAccessToken);
  },
};

const providerBehaviorMap: Partial<Record<Exclude<RepositoryProviderSelection, ''>, RepositorySourceProviderBehavior>> = {
  'azure-devops': azureBehavior,
  github: namespaceBehavior,
  gitlab: namespaceBehavior,
};

export function getRepositorySourceProviderBehavior(
  provider: RepositoryProviderSelection,
): RepositorySourceProviderBehavior | null {
  if (!provider) {
    return null;
  }

  return providerBehaviorMap[provider] || null;
}
