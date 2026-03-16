import type { RepositoryProject, ReviewItem } from '../../../../types/repository';
import type { RepositorySourceStatePort } from './repositorySourceApiPorts';

export function clearProjectsState(state: RepositorySourceStatePort) {
  state.setProjects([]);
}

export function applyProjectsSuccess(
  state: RepositorySourceStatePort,
  provider: string,
  projects: RepositoryProject[],
) {
  state.setProjects(projects);
  if (provider === 'github' || provider === 'gitlab') {
    state.setRepositories(projects.map((project) => ({
      id: project.id,
      name: project.name,
    })));
  }
  state.setProjectDiscoveryWarning(null);
}

export function applyProjectsFailure(
  state: RepositorySourceStatePort,
  message: string,
) {
  state.setProjects([]);
  state.setProjectDiscoveryWarning(
    message.includes('(404)')
      ? 'No se pudieron listar proyectos automaticamente. Puedes escribir el proyecto manualmente y seguir trabajando.'
      : message,
  );
}

export function clearRepositoriesState(state: RepositorySourceStatePort) {
  state.setRepositories([]);
}

export function applyRepositoriesSuccess(
  state: RepositorySourceStatePort,
  repositories: Array<{ id: string; name: string; webUrl?: string; defaultBranch?: string }>,
) {
  state.setRepositories(repositories);
}

export function applyRepositoriesFailure(
  state: RepositorySourceStatePort,
  message: string,
) {
  state.setError(message);
  state.setHasSuccessfulConnection(false);
}

export function applyPullRequestsSuccess(
  state: RepositorySourceStatePort,
  result: ReviewItem[],
) {
  const snapshotTimestamp = new Date();
  state.setPullRequests(result);
  state.setLastUpdatedAt(snapshotTimestamp);
  state.setHasSuccessfulConnection(true);
  state.setIsConnectionPanelOpen(false);
  return snapshotTimestamp;
}

export function applyPullRequestsFailure(
  state: RepositorySourceStatePort,
  message: string,
) {
  state.setPullRequests([]);
  state.setLastUpdatedAt(null);
  state.setHasSuccessfulConnection(false);
  state.setError(message);
}
