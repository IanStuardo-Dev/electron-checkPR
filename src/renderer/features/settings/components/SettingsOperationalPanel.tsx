import React from 'react';
import type { RepositoryProviderDefinition } from '../../../../types/repository';
import ConnectionSummary from '../../dashboard/components/ConnectionSummary';
import type { DashboardSummary, SavedConnectionConfig } from '../../dashboard/types';
import { BoltIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { SettingsSectionCard, SettingsStatTile, SettingsStatusBadge } from './SettingsPrimitives';

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
      eyebrow="Prioridad 1"
      title="Resumen operativo"
      description="Empieza aqui: esta vista resume el estado del workspace y deja el detalle tecnico fuera del camino principal."
      badge={<SettingsStatusBadge tone={isConnectionReady ? 'emerald' : 'amber'} label={isConnectionReady ? 'Workspace operativo' : 'Faltan pasos'} />}
      actions={(
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <BoltIcon className="h-4 w-4 text-sky-600" />
            Secrets solo en sesion
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <WrenchScrewdriverIcon className="h-4 w-4 text-sky-600" />
            Diagnostico en panel lateral
          </span>
        </div>
      )}
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsStatTile label="Provider activo" value={config.provider ? activeProviderName : 'No seleccionado'} description="Fuente primaria de repositorios y PRs para esta sesion." />
            <SettingsStatTile label="Conexion" value={isConnectionReady ? 'OK' : 'Pendiente'} description={isConnectionReady ? 'Sesion autenticada y sincronizacion exitosa.' : 'Falta autenticar o sincronizar el provider activo.'} />
            <SettingsStatTile label="Scope actual" value={selectedRepositoryName || selectedProjectName || 'Global'} description={summary.scopeLabel} />
            <SettingsStatTile label="Codex" value={isCodexReady ? 'Listo' : 'Pendiente'} description="Disponibilidad de analisis AI sobre ramas exactas y PRs." />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Siguiente accion</p>
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
          </div>
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
