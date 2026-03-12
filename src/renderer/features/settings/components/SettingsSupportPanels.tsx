import React from 'react';
import type { AzureDiagnostics, SavedConnectionConfig } from '../../dashboard/types';
import { SettingsModal, SettingsSectionCard, SettingsStatusBadge } from './SettingsPrimitives';

export function SettingsDiagnosticsSection({
  activeProviderName,
  config,
  diagnostics,
  hasCredentialsInSession,
  hasSuccessfulConnection,
}: {
  activeProviderName: string;
  config: SavedConnectionConfig;
  diagnostics: AzureDiagnostics;
  hasCredentialsInSession: boolean;
  hasSuccessfulConnection: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <SettingsSectionCard
      eyebrow="Prioridad 3"
      title="Diagnostico del provider"
      description="La vista principal queda limpia y el detalle tecnico vive en un modal dedicado."
      badge={<SettingsStatusBadge tone={diagnostics.lastError ? 'rose' : 'slate'} label={diagnostics.lastError ? 'Con error' : 'Sin error activo'} />}
      actions={(
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 sm:w-auto"
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Operacion</p>
            <p className="mt-2 font-medium text-slate-900">{diagnostics.operation || 'sin ejecucion'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sesion</p>
            <p className="mt-2 font-medium text-slate-900">{hasCredentialsInSession ? 'Credenciales cargadas' : 'Sin credenciales'}</p>
          </div>
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
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-600">
            <p className="font-medium text-slate-900">Persistencia y sesion</p>
            <p className="mt-2">Las fuentes de repositorios no persisten organizacion, proyecto ni repositorio al cerrar la app.</p>
            <p>Se guarda solo en sesion el token del provider activo y la API key de Codex para no persistir secretos en disco.</p>
          </div>

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

export function SettingsRoadmapSection() {
  return (
    <SettingsSectionCard
      eyebrow="Roadmap"
      title="Integraciones futuras"
      description="Lo que venga despues debe caer aqui sin competir con la configuracion operativa del dia a dia."
    >
      <div className="space-y-4">
        <IntegrationCard title="Security Providers" description="Conectores a scanners externos, SAST/DAST y fuentes de vulnerabilidades." status="Planned" />
        <IntegrationCard title="Notifications" description="Canales como Teams, Slack o email con reglas por riesgo y SLA." status="Planned" />
      </div>
    </SettingsSectionCard>
  );
}

function IntegrationCard({ title, description, status }: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">{status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  );
}
