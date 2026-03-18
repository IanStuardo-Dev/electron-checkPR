import React from 'react';
import type { CodexIntegrationConfig } from '../../types';
import {
  SettingsField,
  SettingsSelectField,
  SettingsStatTile,
  SettingsToggleCard,
} from '../../../../ui/configuration/ConfigurationPrimitives';
import type { CodexIntegrationChangeHandler } from './CodexIntegration.shared';

interface CodexIntegrationSettingsGridProps {
  config: CodexIntegrationConfig;
  onChange: CodexIntegrationChangeHandler;
}

export const CodexIntegrationSettingsGrid = ({
  config,
  onChange,
}: CodexIntegrationSettingsGridProps) => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SettingsStatTile
        label="Modelo"
        value={config.model}
        description="Modelo activo para analisis de repositorios y PRs."
      />
      <SettingsStatTile
        label="Profundidad"
        value={config.analysisDepth === 'deep' ? 'Deep' : 'Standard'}
        description="Nivel de inspeccion exigido por defecto."
      />
      <SettingsStatTile
        label="Scope"
        value={config.repositoryScope === 'all' ? 'Todos' : 'Seleccionado'}
        description="Resolucion por defecto al lanzar un analisis."
      />
      <SettingsStatTile
        label="PR AI Review"
        value={config.prReview.enabled ? `${config.prReview.maxPullRequests}` : 'Off'}
        description="PRs que pueden recibir analisis IA por sincronizacion."
      />
    </div>

    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <SettingsToggleCard
        title="Habilitar integracion"
        description="Activa Codex para Repository Analysis y PR AI Review."
        checked={config.enabled}
        onChange={(checked) => onChange('enabled', checked)}
      />

      <SettingsToggleCard
        title="Habilitar PR AI Review"
        description="Activa el analisis IA sobre la cola priorizada de Pull Requests en el dashboard."
        checked={config.prReview.enabled}
        onChange={(checked) => onChange('prReview', {
          ...config.prReview,
          enabled: checked,
        })}
      />

      <SettingsField
        label="API key"
        type="password"
        value={config.apiKey}
        placeholder="sk-..."
        onChange={(value) => onChange('apiKey', value)}
        hint="Se guarda solo en sesion, no en disco."
      />

      <SettingsSelectField
        label="Modelo"
        value={config.model}
        onChange={(value) => onChange('model', value)}
        options={[
          { value: 'gpt-5.2-codex', label: 'gpt-5.2-codex' },
          { value: 'gpt-5.2', label: 'gpt-5.2' },
          { value: 'gpt-5-codex', label: 'gpt-5-codex' },
        ]}
      />

      <SettingsSelectField
        label="Profundidad de analisis"
        value={config.analysisDepth}
        onChange={(value) => onChange('analysisDepth', value as CodexIntegrationConfig['analysisDepth'])}
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'deep', label: 'Deep' },
        ]}
      />

      <SettingsField
        label="Maximo de archivos por corrida"
        type="number"
        value={config.maxFilesPerRun}
        onChange={(value) => onChange('maxFilesPerRun', Number(value) || 0)}
      />

      <SettingsSelectField
        label="Scope por defecto"
        value={config.repositoryScope}
        onChange={(value) => onChange('repositoryScope', value as CodexIntegrationConfig['repositoryScope'])}
        options={[
          { value: 'selected', label: 'Solo repositorio seleccionado' },
          { value: 'all', label: 'Todos los repositorios conectados' },
        ]}
      />

      <SettingsToggleCard
        title="Incluir tests"
        description="Incluye carpetas y archivos de pruebas dentro del contexto del analisis."
        checked={config.includeTests}
        onChange={(checked) => onChange('includeTests', checked)}
      />

      <SettingsField
        label="Maximo de PRs por sincronizacion"
        type="number"
        value={config.prReview.maxPullRequests}
        onChange={(value) => onChange('prReview', {
          ...config.prReview,
          maxPullRequests: Number(value) || 0,
        })}
      />

      <SettingsSelectField
        label="Modo de seleccion"
        value={config.prReview.selectionMode}
        onChange={(value) => onChange('prReview', {
          ...config.prReview,
          selectionMode: value as CodexIntegrationConfig['prReview']['selectionMode'],
        })}
        options={[
          { value: 'top-risk', label: 'Top risk' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'mixed', label: 'Mixed' },
        ]}
      />

      <SettingsSelectField
        label="Profundidad PR AI"
        value={config.prReview.analysisDepth}
        onChange={(value) => onChange('prReview', {
          ...config.prReview,
          analysisDepth: value as CodexIntegrationConfig['prReview']['analysisDepth'],
        })}
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'deep', label: 'Deep' },
        ]}
      />
    </div>
  </>
);
