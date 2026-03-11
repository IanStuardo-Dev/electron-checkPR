import React from 'react';
import type { AzureDiagnostics, SavedConnectionConfig } from '../../dashboard/types';
import { SettingsSectionCard, SettingsStatusBadge } from './SettingsPrimitives';

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
  return (
    <SettingsSectionCard
      eyebrow="Prioridad 3"
      title="Diagnostico del provider"
      description="Revisa aqui errores de autenticacion, scope o resolucion de rutas antes de ir a consola."
      badge={<SettingsStatusBadge tone={diagnostics.lastError ? 'rose' : 'slate'} label={diagnostics.lastError ? 'Con error' : 'Sin error activo'} />}
    >
      <div className="space-y-2 text-sm leading-6 text-slate-600">
        <p><span className="font-medium text-slate-900">Provider:</span> {config.provider ? activeProviderName : '-'}</p>
        <p><span className="font-medium text-slate-900">Operacion:</span> {diagnostics.operation || 'sin ejecucion'}</p>
        <p><span className="font-medium text-slate-900">Organization:</span> {diagnostics.organization || '-'}</p>
        <p><span className="font-medium text-slate-900">Project:</span> {diagnostics.project || '-'}</p>
        <p><span className="font-medium text-slate-900">Repository ID:</span> {diagnostics.repositoryId || '-'}</p>
        <p><span className="font-medium text-slate-900">Request path:</span> {diagnostics.requestPath || '-'}</p>
        <p><span className="font-medium text-slate-900">PAT en sesion:</span> {hasCredentialsInSession ? 'si' : 'no'}</p>
        <p><span className="font-medium text-slate-900">Conexion exitosa:</span> {hasSuccessfulConnection ? 'si' : 'no'}</p>
      </div>
      {diagnostics.lastError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {diagnostics.lastError}
        </div>
      ) : null}
    </SettingsSectionCard>
  );
}

export function SettingsRoadmapSection() {
  return (
    <SettingsSectionCard
      eyebrow="Roadmap"
      title="Integraciones futuras"
      description="Lo que venga despues debe caer aqui, con la misma jerarquia visual y sin competir con la configuracion operativa."
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">{status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  );
}

