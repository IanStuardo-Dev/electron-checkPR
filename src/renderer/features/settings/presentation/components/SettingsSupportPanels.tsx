import React from 'react';
import type { RepositorySourceDiagnostics, SavedConnectionConfig } from '../../../repository-source';
import { SettingsModal, SettingsSectionCard, SettingsStatusBadge, SettingsSurfaceCard, settingsButtonClassName } from '../../../../shared/ui/settings/SettingsPrimitives';

export function SettingsDiagnosticsSection({
  activeProviderName,
  config,
  diagnostics,
  hasCredentialsInSession,
  hasSuccessfulConnection,
}: {
  activeProviderName: string;
  config: SavedConnectionConfig;
  diagnostics: RepositorySourceDiagnostics;
  hasCredentialsInSession: boolean;
  hasSuccessfulConnection: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <SettingsSectionCard
      eyebrow="Soporte"
      title="Diagnostico del provider"
      description="El detalle tecnico vive en un modal dedicado para no contaminar la configuracion diaria."
      badge={<SettingsStatusBadge tone={diagnostics.lastError ? 'rose' : 'slate'} label={diagnostics.lastError ? 'Con error' : 'Sin error activo'} />}
      actions={(
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`w-full sm:w-auto ${settingsButtonClassName}`}
        >
          Abrir diagnostico
        </button>
      )}
    >
      <div className="space-y-3 text-sm leading-6 text-slate-600">
        <p>
          {diagnostics.lastError
            ? 'Hay un error activo en la ultima operacion del provider.'
            : 'No hay errores activos. Abre el diagnostico solo cuando necesites revisar autenticacion, scope o request path.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsSurfaceCard className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Operacion</p>
            <p className="mt-2 font-medium text-slate-900">{diagnostics.operation || 'sin ejecucion'}</p>
          </SettingsSurfaceCard>
          <SettingsSurfaceCard className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sesion</p>
            <p className="mt-2 font-medium text-slate-900">{hasCredentialsInSession ? 'Credenciales cargadas' : 'Sin credenciales'}</p>
          </SettingsSurfaceCard>
        </div>
      </div>
      {diagnostics.lastError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {diagnostics.lastError}
        </div>
      ) : null}

      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Diagnostico del provider"
        description="Detalle tecnico de autenticacion, scope, request path y estado de sesion. Usa este panel cuando necesites entender por que una fuente no responde como esperas."
        footer={(
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={settingsButtonClassName}
            >
              Cerrar
            </button>
          </div>
        )}
      >
        <div className="space-y-5">
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <p><span className="font-medium text-slate-900">Provider:</span> {config.provider ? activeProviderName : '-'}</p>
            <p><span className="font-medium text-slate-900">Operacion:</span> {diagnostics.operation || 'sin ejecucion'}</p>
            <p><span className="font-medium text-slate-900">Organization:</span> {diagnostics.organization || '-'}</p>
            <p><span className="font-medium text-slate-900">Project:</span> {diagnostics.project || '-'}</p>
            <p><span className="font-medium text-slate-900">Repository ID:</span> {diagnostics.repositoryId || '-'}</p>
            <p className="break-all"><span className="font-medium text-slate-900">Request path:</span> {diagnostics.requestPath || '-'}</p>
            <p><span className="font-medium text-slate-900">PAT en sesion:</span> {hasCredentialsInSession ? 'si' : 'no'}</p>
            <p><span className="font-medium text-slate-900">Conexion exitosa:</span> {hasSuccessfulConnection ? 'si' : 'no'}</p>
          </div>

          <SettingsSurfaceCard className="text-sm leading-6 text-slate-600">
            <p className="font-medium text-slate-900">Persistencia y sesion</p>
            <p className="mt-2">Las fuentes de repositorios no persisten organizacion, proyecto ni repositorio al cerrar la app.</p>
            <p>Se guarda solo en sesion el token del provider activo y la API key de Codex para no persistir secretos en disco.</p>
          </SettingsSurfaceCard>

          {diagnostics.lastError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {diagnostics.lastError}
            </div>
          ) : null}
        </div>
      </SettingsModal>
    </SettingsSectionCard>
  );
}
