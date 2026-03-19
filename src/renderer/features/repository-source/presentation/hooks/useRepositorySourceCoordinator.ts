import { useRepositorySourceBootstrap } from './useRepositorySourceBootstrap';
import { useRepositorySourceController } from './useRepositorySourceController';
import type { ReturnTypeUseRepositorySourceWiring } from './useRepositorySourceViewModel.types';

interface UseRepositorySourceCoordinatorOptions {
  wiring: ReturnTypeUseRepositorySourceWiring;
}

export function useRepositorySourceCoordinator({
  wiring,
}: UseRepositorySourceCoordinatorOptions) {
  const controller = useRepositorySourceController({
    config: wiring.config,
    configRef: wiring.configRef,
    activeProviderName: wiring.activeProviderName,
    scopeLabel: wiring.baseScopeLabel,
    onPersistSnapshot: wiring.persistSnapshot,
  });

  useRepositorySourceBootstrap({
    migrateLegacyStorage: wiring.migrateLegacyStorage,
    applyHydratedSecret: wiring.applyHydratedSecret,
    hydrateSecret: wiring.hydrateSecret,
    refreshPullRequests: controller.refreshPullRequests,
  });

  return controller;
}
