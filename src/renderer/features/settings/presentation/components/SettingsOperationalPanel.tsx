import React from 'react';
import type { RepositoryProviderDefinition } from '../../../../../types/repository';
import type { DashboardSummary } from '../../../../shared/dashboard/summary.types';
import { ConnectionSummary } from '../../../repository-source';
import type { SavedConnectionConfig } from '../../../repository-source';
import { SettingsSectionCard, SettingsStatTile, SettingsStatusBadge, SettingsSurfaceCard } from '../../../../shared/ui/settings/SettingsPrimitives';

export function SettingsOperationalSection({
  activeProvider,
  activeProviderName,
  config,
  selectedProjectName,
  selectedRepositoryName,
  summary,
  isConnectionReady,
  isCodexReady,
}: {
  activeProvider: RepositoryProviderDefinition | null;
  activeProviderName: string;
  config: SavedConnectionConfig;
  selectedProjectName: string | null;
  selectedRepositoryName: string | null;
  summary: DashboardSummary;
  isConnectionReady: boolean;
  isCodexReady: boolean;
}) {
  return (
    <SettingsSectionCard
      eyebrow="Resumen"
      title="Resumen operativo"
      description="El estado esencial del workspace vive aqui. Todo lo demas se abre bajo demanda para que Settings no se convierta en un formulario gigante."
      badge={<SettingsStatusBadge tone={isConnectionReady ? 'emerald' : 'amber'} label={isConnectionReady ? 'Workspace operativo' : 'Faltan pasos'} />}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsStatTile label="Provider activo" value={config.provider ? activeProviderName : 'No seleccionado'} description="Fuente primaria de repositorios y PRs para esta sesion." />
            <SettingsStatTile label="Conexion" value={isConnectionReady ? 'OK' : 'Pendiente'} description={isConnectionReady ? 'Sesion autenticada y sincronizacion exitosa.' : 'Falta autenticar o sincronizar el provider activo.'} />
            <SettingsStatTile label="Scope actual" value={selectedRepositoryName || selectedProjectName || 'Global'} description={summary.scopeLabel} />
            <SettingsStatTile label="Codex" value={isCodexReady ? 'Listo' : 'Pendiente'} description="Disponibilidad de analisis AI sobre ramas exactas y PRs." />
          </div>
          <SettingsSurfaceCard className="bg-slate-50/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Siguiente paso</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              {!config.provider
                ? 'Selecciona un provider'
                : !isConnectionReady
                  ? 'Conecta y sincroniza la fuente'
                  : !isCodexReady
                    ? 'Completa la integracion Codex'
                    : 'El workspace esta listo'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {!config.provider
                ? 'Elige Azure DevOps, GitHub o GitLab para definir el contexto operativo.'
                : !isConnectionReady
                  ? 'Autentica el provider activo y ejecuta una sincronizacion inicial.'
                  : !isCodexReady
                  ? 'Configura la API key y las reglas base de Codex para habilitar PR AI Review y Repository Analysis.'
                    : 'Puedes ir al dashboard para operar la cola de PRs o lanzar un analisis profundo de repositorio.'}
            </p>
          </SettingsSurfaceCard>
        </div>

        <ConnectionSummary
          providerKind={activeProvider?.kind}
          providerName={activeProviderName}
          scopeLabel={summary.scopeLabel}
          projectName={selectedProjectName}
          repositoryName={selectedRepositoryName}
          isConnected={isConnectionReady}
          empty={!config.provider}
          actionLabel="Dashboard"
          actionTo="/"
        />
      </div>
    </SettingsSectionCard>
  );
}
