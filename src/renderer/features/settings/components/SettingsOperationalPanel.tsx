import React from 'react';
import type { RepositoryProviderDefinition } from '../../../../types/repository';
import ConnectionSummary from '../../dashboard/components/ConnectionSummary';
import type { DashboardSummary, SavedConnectionConfig } from '../../dashboard/types';
import { BoltIcon } from '@heroicons/react/24/outline';
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
    <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
      <SettingsSectionCard
        eyebrow="Prioridad 1"
        title="Resumen operativo"
        description="Empieza aqui: esta card te dice si el workspace esta listo o que pieza falta antes de entrar al dashboard o lanzar un analisis."
        badge={<SettingsStatusBadge tone={isConnectionReady ? 'emerald' : 'amber'} label={isConnectionReady ? 'Workspace operativo' : 'Faltan pasos'} />}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsStatTile label="Provider activo" value={config.provider ? activeProviderName : 'No seleccionado'} description="Fuente primaria de repositorios y PRs para esta sesion." />
            <SettingsStatTile label="Conexion" value={isConnectionReady ? 'OK' : 'Pendiente'} description={isConnectionReady ? 'Sesion autenticada y sincronizacion exitosa.' : 'Falta autenticar o sincronizar el provider activo.'} />
            <SettingsStatTile label="Scope actual" value={selectedRepositoryName || selectedProjectName || 'Global'} description={summary.scopeLabel} />
            <SettingsStatTile label="Codex" value={isCodexReady ? 'Listo' : 'Pendiente'} description="Disponibilidad de analisis AI sobre ramas exactas." />
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
                    ? 'Configura la API key y politicas de Codex para habilitar Repository Analysis.'
                    : 'Puedes navegar al dashboard o ejecutar un analisis de repositorio con contexto completo.'}
            </p>
          </div>
        </div>
      </SettingsSectionCard>

      <div className="space-y-6">
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

        <SettingsSectionCard
          eyebrow="Politica"
          title="Persistencia y sesion"
          description="Esta app distingue entre configuracion reutilizable y secretos efimeros para no mezclar comodidad con riesgo."
          actions={<BoltIcon className="h-5 w-5 text-sky-600" />}
        >
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <p>Las fuentes de repositorios no persisten organizacion, proyecto ni repositorio al cerrar la app.</p>
            <p>Se guarda solo en sesion: el token del provider activo, para no persistir secretos ni contexto sensible en disco.</p>
            <p>Este mismo patron se aplica tambien a Codex: configuracion persistida y API key solo en sesion.</p>
          </div>
        </SettingsSectionCard>
      </div>
    </section>
  );
}
