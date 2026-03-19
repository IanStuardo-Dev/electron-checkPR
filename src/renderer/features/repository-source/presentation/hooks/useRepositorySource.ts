import { useRepositorySourceDerived } from './useRepositorySourceDerived';
import { useRepositorySourceCoordinator } from './useRepositorySourceCoordinator';
import { useRepositorySourceViewModel } from './useRepositorySourceViewModel';
import { useRepositorySourceWiring } from './useRepositorySourceWiring';

export function useRepositorySource() {
  const wiring = useRepositorySourceWiring();
  const controller = useRepositorySourceCoordinator({ wiring });

  const derived = useRepositorySourceDerived({
    config: wiring.config,
    projects: controller.projects,
    repositories: controller.repositories,
    pullRequests: controller.pullRequests,
    lastUpdatedAt: controller.lastUpdatedAt,
    hasSuccessfulConnection: controller.hasSuccessfulConnection,
  });
  return useRepositorySourceViewModel({
    wiring,
    controller,
    derived,
  });
}
