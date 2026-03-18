import React from 'react';
import type { DashboardSummary } from '../../../../shared/dashboard/summary.types';
import type { CodexIntegrationConfig } from '../../types';
import { SettingsActionCard, SettingsStatusBadge } from '../../../../ui/configuration/ConfigurationPrimitives';

interface SettingsIntegrationActionCardsProps {
  activeProviderLabel: string;
  selectedProjectName: string | null;
  selectedRepositoryName: string | null;
  summary: DashboardSummary;
  isConnectionReady: boolean;
  codexConfig: CodexIntegrationConfig;
  isCodexReady: boolean;
  onOpenProvider: () => void;
  onOpenCodex: () => void;
  onOpenSnapshot: () => void;
}

const SettingsIntegrationActionCards = ({
  activeProviderLabel,
  selectedProjectName,
  selectedRepositoryName,
  summary,
  isConnectionReady,
  codexConfig,
  isCodexReady,
  onOpenProvider,
  onOpenCodex,
  onOpenSnapshot,
}: SettingsIntegrationActionCardsProps) => {
  const snapshotRulesCount = codexConfig.snapshotPolicy.excludedPathPatterns
    .split('\n')
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .length;

  return (
    <div className="grid gap-4 lg:auto-rows-fr lg:grid-cols-3">
      <SettingsActionCard
        eyebrow="Provider"
        title="Fuente principal"
        description="Selecciona el provider activo y ajusta alcance o conexion solo cuando realmente lo necesites."
        badge={<SettingsStatusBadge tone={isConnectionReady ? 'emerald' : 'amber'} label={isConnectionReady ? 'Conectado' : 'Pendiente'} />}
        summaryLabel="Activo"
        summaryValue={activeProviderLabel}
        summaryDescription={selectedRepositoryName || selectedProjectName || summary.scopeLabel}
        actionLabel="Abrir configuracion"
        onAction={onOpenProvider}
      />

      <SettingsActionCard
        eyebrow="Codex"
        title="Analisis AI"
        description="Mantiene a mano el estado de la integracion sin exponer todos los campos en la vista principal."
        badge={<SettingsStatusBadge tone={isCodexReady ? 'emerald' : 'amber'} label={isCodexReady ? 'Listo' : 'Pendiente'} />}
        summaryLabel="Modelo"
        summaryValue={codexConfig.model}
        summaryDescription={codexConfig.enabled ? 'Integracion habilitada para analisis.' : 'Integracion deshabilitada en esta sesion.'}
        actionLabel="Abrir configuracion"
        onAction={onOpenCodex}
      />

      <SettingsActionCard
        eyebrow="Snapshots"
        title="Politica global"
        description="Agrupa reglas base y modo estricto sin mezclar este detalle con la operacion diaria."
        badge={<SettingsStatusBadge tone="sky" label={`${snapshotRulesCount} reglas`} />}
        summaryLabel="Modo"
        summaryValue={codexConfig.snapshotPolicy.strictMode ? 'Estricto' : 'Flexible'}
        summaryDescription="Base comun para Repository Analysis y PR AI Review."
        actionLabel="Editar reglas"
        onAction={onOpenSnapshot}
      />
    </div>
  );
};

export default SettingsIntegrationActionCards;
