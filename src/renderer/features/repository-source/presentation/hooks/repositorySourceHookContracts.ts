import type { RepositorySourceDiagnosticsPort, RepositorySourceStatePort } from '../../application/repositorySourceApiPorts';
import type { RepositorySourceDiagnostics } from '../../types';

export interface RepositorySourceDiagnosticsController extends RepositorySourceDiagnosticsPort {
  diagnostics: RepositorySourceDiagnostics;
  resetDiagnosticsError(): void;
}

export interface RepositorySourceActionStatePort {
  resetForConfigChange(name: string, value: string): void;
  setIsConnectionPanelOpen(value: boolean): void;
  markProjectSelection(project: string): void;
}

export interface RepositorySourceEffectsStatePort extends RepositorySourceStatePort {
  shouldLoadRepositories: boolean;
  resetDisconnectedState(): void;
  setShouldLoadRepositories(value: boolean): void;
}
