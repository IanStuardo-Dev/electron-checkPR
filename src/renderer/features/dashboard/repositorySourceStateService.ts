import type { RepositoryProject, ReviewItem } from '../../../types/repository';
import type { useRepositorySourceState } from './hooks/useRepositorySourceState';

type RepositorySourceState = ReturnType<typeof useRepositorySourceState>;

export function clearProjectsState(state: RepositorySourceState) {
  state.setProjects([]);
}

export function applyProjectsSuccess(
  state: RepositorySourceState,
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
  state: RepositorySourceState,
  message: string,
) {
  state.setProjects([]);
  state.setProjectDiscoveryWarning(
    message.includes('(404)')
      ? 'No se pudieron listar proyectos automaticamente. Puedes escribir el proyecto manualmente y seguir trabajando.'
      : message,
  );
}

export function clearRepositoriesState(state: RepositorySourceState) {
  state.setRepositories([]);
}

export function applyRepositoriesSuccess(
  state: RepositorySourceState,
  repositories: Array<{ id: string; name: string; webUrl?: string; defaultBranch?: string }>,
) {
  state.setRepositories(repositories);
}

export function applyRepositoriesFailure(
  state: RepositorySourceState,
  message: string,
) {
  state.setError(message);
  state.setHasSuccessfulConnection(false);
}

export function applyPullRequestsSuccess(
  state: RepositorySourceState,
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
  state: RepositorySourceState,
  message: string,
) {
  state.setPullRequests([]);
  state.setLastUpdatedAt(null);
  state.setHasSuccessfulConnection(false);
  state.setError(message);
}

